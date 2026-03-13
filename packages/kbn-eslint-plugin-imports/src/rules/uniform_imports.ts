/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import Path from 'path';

import type { Rule } from 'eslint';
import { getRelativeImportReq, getPackageRelativeImportReq } from '@kbn/import-resolver';

import { report } from '../helpers/report';
import { visitAllImportStatements } from '../helpers/visit_all_import_statements';
import { getSourcePath } from '../helpers/source';
import { getImportResolver } from '../get_import_resolver';
import type { Importer } from '../helpers/visit_all_import_statements';
import { getNodeEsmExtension, isNodeEsmFile } from '../helpers/node_module_type';

const ESM_IMPORT_EXT_RE = /\.(?:[cm]?jsx?|(?:d\.)?[cm]?tsx?|json)$/;

const isDynamicImport = (importer: Importer): boolean =>
  importer.type === 'ImportExpression' ||
  (importer.type === 'CallExpression' && 'callee' in importer && importer.callee.type === 'Import');

const usesNodeEsmRelativeImports = (sourcePath: string, importer: Importer): boolean => {
  if (isDynamicImport(importer)) {
    return true;
  }

  return isNodeEsmFile(sourcePath);
};

export const UniformImportsRule: Rule.RuleModule = {
  meta: {
    fixable: 'code',
    docs: {
      url: 'https://github.com/elastic/kibana/blob/main/packages/kbn-eslint-plugin-imports/README.mdx#kbnimportsuniform_imports',
    },
  },

  create(context) {
    const resolver = getImportResolver(context);
    const sourcePath = getSourcePath(context);
    const sourceDirname = Path.dirname(sourcePath);
    const ownPackageId = resolver.getPackageIdForPath(sourcePath);

    return visitAllImportStatements((req, { node, type, importer }) => {
      if (!req) {
        return;
      }

      if (type === 'esm' && req.startsWith('.') && ESM_IMPORT_EXT_RE.test(req)) {
        return;
      }

      const result = resolver.resolve(req, sourceDirname);
      if (result?.type !== 'file' || result.nodeModule) {
        return;
      }

      const explicitRelativeEsmImport =
        type === 'esm' && req.startsWith('.') && usesNodeEsmRelativeImports(sourcePath, importer);
      const emittedExtension = explicitRelativeEsmImport
        ? getNodeEsmExtension(result.absolute)
        : undefined;

      const { pkgId } = result;

      if (pkgId === ownPackageId || !pkgId) {
        const correct = getRelativeImportReq({
          ...result,
          original: req,
          dirname: sourceDirname,
          sourcePath,
          type,
          emittedExtension,
          preserveIndex: explicitRelativeEsmImport,
        });

        if (req !== correct) {
          report(context, {
            node,
            message: `Use import request [${correct}]`,
            correctImport: correct,
          });
        }
        return;
      }

      const packageDir = resolver.getAbsolutePackageDir(pkgId);
      if (!packageDir) {
        report(context, {
          node,
          message: `Unable to determine location of package [${pkgId}]`,
        });
        return;
      }

      const correct = getPackageRelativeImportReq({
        ...result,
        packageDir,
        pkgId,
        type,
      });

      if (req !== correct) {
        report(context, {
          node,
          message: `Use import request [${correct}]`,
          correctImport: correct,
        });
        return;
      }
    });
  },
};
