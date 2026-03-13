/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

const Path = require('path');
const { getRelativeImportReq } = require('@kbn/import-resolver');

const { getImportResolver } = require('../get_import_resolver');
const { getSourcePath } = require('../helpers/source');
const { emitsCommonJs, getNodeEsmExtension } = require('../helpers/node_module_type');

/** @typedef {import("eslint").Rule.RuleModule} Rule */

const ERROR_MSG =
  'React.lazy() loaders importing CommonJS TypeScript modules must unwrap the nested default export.';

const isIdentifier = (node, name) =>
  node?.type === 'Identifier' && (name ? node.name === name : true);

const isStringLiteral = (node) => node?.type === 'Literal' && typeof node.value === 'string';

const isImportExpression = (node) => node?.type === 'ImportExpression';

const isBabelImportCall = (node) =>
  node?.type === 'CallExpression' && node.callee?.type === 'Import';

const isDynamicImport = (node) => isImportExpression(node) || isBabelImportCall(node);

const getImportSource = (importNode) => {
  if (isImportExpression(importNode)) {
    return isStringLiteral(importNode.source)
      ? {
          req: importNode.source.value,
          sourceNode: importNode.source,
        }
      : null;
  }

  const [firstArg] = importNode.arguments;
  return firstArg && isStringLiteral(firstArg)
    ? {
        req: firstArg.value,
        sourceNode: firstArg,
      }
    : null;
};

const getReturnedObjectExpression = (body) => {
  if (body.type === 'ObjectExpression') {
    return body;
  }

  if (body.type !== 'BlockStatement' || body.body.length !== 1) {
    return null;
  }

  const [statement] = body.body;
  if (statement?.type !== 'ReturnStatement' || !statement.argument) {
    return null;
  }

  return statement.argument.type === 'ObjectExpression' ? statement.argument : null;
};

const getDefaultPropertyValue = (objectExpression) => {
  if (objectExpression.properties.length !== 1) {
    return null;
  }

  const [property] = objectExpression.properties;
  if (
    property.type !== 'Property' ||
    property.kind !== 'init' ||
    property.method ||
    property.computed ||
    !isIdentifier(property.key, 'default')
  ) {
    return null;
  }

  return property.value;
};

const isDefaultMemberAccess = (node, objectName) =>
  node.type === 'MemberExpression' &&
  !node.computed &&
  isIdentifier(node.object, objectName) &&
  isIdentifier(node.property, 'default');

const isNestedDefaultMemberAccess = (node, objectName) =>
  node.type === 'MemberExpression' &&
  !node.computed &&
  node.object.type === 'MemberExpression' &&
  !node.object.computed &&
  isIdentifier(node.object.object, objectName) &&
  isIdentifier(node.object.property, 'default') &&
  isIdentifier(node.property, 'default');

const needsInteropFix = (callback) => {
  if (callback.params.length !== 1) {
    return null;
  }

  const returnedObjectExpression = getReturnedObjectExpression(callback.body);
  if (!returnedObjectExpression) {
    return null;
  }

  const defaultValue = getDefaultPropertyValue(returnedObjectExpression);
  if (!defaultValue) {
    return null;
  }

  const [param] = callback.params;
  if (!param) {
    return null;
  }

  if (param.type === 'ObjectPattern') {
    if (param.properties.length !== 1) {
      return null;
    }

    const [property] = param.properties;
    if (
      property.type !== 'Property' ||
      property.kind !== 'init' ||
      property.computed ||
      !isIdentifier(property.key, 'default') ||
      !isIdentifier(property.value)
    ) {
      return null;
    }

    if (isIdentifier(defaultValue, property.value.name)) {
      return true;
    }

    if (isDefaultMemberAccess(defaultValue, property.value.name)) {
      return false;
    }

    return null;
  }

  if (!isIdentifier(param)) {
    return null;
  }

  if (isDefaultMemberAccess(defaultValue, param.name)) {
    return true;
  }

  if (isNestedDefaultMemberAccess(defaultValue, param.name)) {
    return false;
  }

  return null;
};

const getLazyLoaderInfo = (body) => {
  if (isDynamicImport(body)) {
    const source = getImportSource(body);
    return source
      ? {
          importNode: body,
          importSourceNode: source.sourceNode,
          req: source.req,
          needsFix: true,
        }
      : null;
  }

  if (
    body.type !== 'CallExpression' ||
    body.arguments.length !== 1 ||
    body.callee.type !== 'MemberExpression' ||
    body.callee.computed ||
    !isIdentifier(body.callee.property, 'then') ||
    !isDynamicImport(body.callee.object)
  ) {
    return null;
  }

  const [callback] = body.arguments;
  if (callback.type !== 'ArrowFunctionExpression' && callback.type !== 'FunctionExpression') {
    return null;
  }

  const needsFix = needsInteropFix(callback);
  if (needsFix === null) {
    return null;
  }

  const source = getImportSource(body.callee.object);
  return source
    ? {
        importNode: body.callee.object,
        importSourceNode: source.sourceNode,
        req: source.req,
        needsFix,
      }
    : null;
};

const getNormalizedImportText = ({ sourceCode, importNode, importSourceNode, req, correctReq }) => {
  const importText = sourceCode.getText(importNode);
  if (req === correctReq) {
    return importText;
  }

  return importText.replace(sourceCode.getText(importSourceNode), `'${correctReq}'`);
};

/** @type {Rule} */
const ReactLazyDefaultInteropRule = {
  meta: {
    fixable: 'code',
    schema: [],
    docs: {
      url: 'https://github.com/elastic/kibana/blob/main/packages/kbn-eslint-plugin-imports/README.mdx#kbnimportsreact_lazy_default_interop',
    },
  },

  create(context) {
    const lazyIdentifiers = new Set();
    const reactNamespaceIdentifiers = new Set();
    const resolver = getImportResolver(context);
    const sourcePath = getSourcePath(context);
    const sourceDirname = Path.dirname(sourcePath);
    const sourceCode = context.sourceCode;

    return {
      ImportDeclaration(node) {
        if (node.source.value !== 'react') {
          return;
        }

        for (const specifier of node.specifiers) {
          if (specifier.type === 'ImportSpecifier' && isIdentifier(specifier.imported, 'lazy')) {
            lazyIdentifiers.add(specifier.local.name);
          }

          if (
            specifier.type === 'ImportDefaultSpecifier' ||
            specifier.type === 'ImportNamespaceSpecifier'
          ) {
            reactNamespaceIdentifiers.add(specifier.local.name);
          }
        }
      },

      CallExpression(node) {
        const isLazyCall =
          (node.callee.type === 'Identifier' && lazyIdentifiers.has(node.callee.name)) ||
          (node.callee.type === 'MemberExpression' &&
            !node.callee.computed &&
            isIdentifier(node.callee.object) &&
            reactNamespaceIdentifiers.has(node.callee.object.name) &&
            isIdentifier(node.callee.property, 'lazy'));

        if (!isLazyCall || node.arguments.length !== 1) {
          return;
        }

        const [loader] = node.arguments;
        if (loader.type !== 'ArrowFunctionExpression' && loader.type !== 'FunctionExpression') {
          return;
        }

        const info = getLazyLoaderInfo(loader.body);
        if (!info || !info.needsFix) {
          return;
        }

        const result = resolver.resolve(info.req, sourceDirname);
        if (result?.type !== 'file' || result.nodeModule || !emitsCommonJs(result.absolute)) {
          return;
        }

        const correctReq = info.req.startsWith('.')
          ? getRelativeImportReq({
              ...result,
              original: info.req,
              dirname: sourceDirname,
              sourcePath,
              type: 'esm',
              emittedExtension: getNodeEsmExtension(result.absolute),
              preserveIndex: true,
            })
          : info.req;

        context.report({
          node: loader.body,
          message: ERROR_MSG,
          fix(fixer) {
            const normalizedImportText = getNormalizedImportText({
              sourceCode,
              importNode: info.importNode,
              importSourceNode: info.importSourceNode,
              req: info.req,
              correctReq,
            });

            return fixer.replaceText(
              loader.body,
              `${normalizedImportText}.then(({ default: lazyModule }) => ({ default: lazyModule.default }))`
            );
          },
        });
      },
    };
  },
};

module.exports = ReactLazyDefaultInteropRule;
module.exports.ReactLazyDefaultInteropRule = ReactLazyDefaultInteropRule;
