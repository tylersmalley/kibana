/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import Path from 'path';

import normalizePath from 'normalize-path';

export type ImportType = 'esm' | 'require' | 'require-resolve' | 'jest';

interface WrapOptions {
  prefix?: string;
  postfix?: string;
}
function wrap(req: string, options: WrapOptions) {
  return `${options.prefix ?? ''}${req}${options.postfix ?? ''}`;
}

const EXT_RE = /\.(?:[cm]?jsx?|(?:d\.)?[cm]?tsx?)$/;
const INDEX_IN_INDEX_RE = /\/index\/index(\.(?:[cm]?jsx?|(?:d\.)?[cm]?tsx?))$/;
const INCLUDES_FILENAME_RE = /\/.*\..{2,4}$/;

interface ReduceImportRequestOptions {
  emittedExtension?: string;
  preserveIndex?: boolean;
}

export function reduceImportRequest(
  req: string,
  type: ImportType,
  original?: string,
  sourceExt?: string,
  options: ReduceImportRequestOptions = {}
) {
  let reduced = req;

  if (
    original &&
    (type === 'require-resolve' || sourceExt === '.mjs') &&
    original.match(INCLUDES_FILENAME_RE)
  ) {
    // require.resolve() can be a complicated, it's often used in config files and
    // sometimes we don't have babel to help resolve .ts to .js, so we try to rely
    // on the original request and keep the filename listed if it's in the original
    return req;
  }

  const indexInIndexMatch = req.match(INDEX_IN_INDEX_RE);
  if (indexInIndexMatch) {
    if (
      !options.preserveIndex &&
      indexInIndexMatch[1] !== '.ts' &&
      indexInIndexMatch[1] !== '.tsx'
    ) {
      // this is a very ambiguous request, leave the whole import statement to make it less so
      return req;
    }
  }

  const extMatch = req.match(EXT_RE);
  if (extMatch) {
    reduced = reduced.slice(0, -extMatch[0].length);
  }

  if (!options.preserveIndex && reduced === 'index') {
    return '';
  }

  if (!options.preserveIndex && reduced.endsWith('/index')) {
    reduced = reduced.slice(0, -6);
  }

  if (options.emittedExtension && !Path.extname(reduced)) {
    reduced += options.emittedExtension;
  }

  return reduced;
}

interface RelativeImportReqOptions extends WrapOptions {
  dirname: string;
  absolute: string;
  type: ImportType;
  sourcePath?: string;
  original?: string;
  emittedExtension?: string;
  preserveIndex?: boolean;
}

export function getRelativeImportReq(options: RelativeImportReqOptions) {
  const relative = normalizePath(Path.relative(options.dirname, options.absolute));
  return wrap(
    reduceImportRequest(
      relative.startsWith('.') ? relative : `./${relative}`,
      options.type,
      options.original,
      options.sourcePath ? Path.extname(options.sourcePath) : undefined,
      {
        emittedExtension: options.emittedExtension,
        preserveIndex: options.preserveIndex,
      }
    ),
    options
  );
}

interface PackageRelativeImportReqOptions extends WrapOptions {
  packageDir: string;
  absolute: string;
  pkgId: string;
  type: ImportType;
}

const pkgMainCache = new Map<string, string | null>();
function getPkgMain(pkgDir: string) {
  const cached = pkgMainCache.get(pkgDir);
  if (cached !== undefined) {
    return cached;
  }
  try {
    const main = require.resolve(pkgDir);
    pkgMainCache.set(pkgDir, main);
    return main;
  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') {
      pkgMainCache.set(pkgDir, null);
      return null;
    }

    throw error;
  }
}

export function getPackageRelativeImportReq(options: PackageRelativeImportReqOptions) {
  if (options.absolute === getPkgMain(options.packageDir)) {
    return wrap(options.pkgId, options);
  }

  const relative = normalizePath(Path.relative(options.packageDir, options.absolute));

  if (!relative) {
    return wrap(options.pkgId, options);
  }

  const subPath = reduceImportRequest(relative, options.type);

  return wrap(subPath ? `${options.pkgId}/${subPath}` : options.pkgId, options);
}
