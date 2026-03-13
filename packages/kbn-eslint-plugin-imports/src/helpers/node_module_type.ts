/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import Fs from 'fs';
import Path from 'path';

const packageTypeCache = new Map<string, boolean>();

const isModulePackage = (sourcePath: string): boolean => {
  let dir = Path.dirname(sourcePath);
  const visitedDirs: string[] = [];

  while (true) {
    const cached = packageTypeCache.get(dir);
    if (cached !== undefined) {
      for (const visitedDir of visitedDirs) {
        packageTypeCache.set(visitedDir, cached);
      }
      return cached;
    }

    visitedDirs.push(dir);

    const packageJsonPath = Path.join(dir, 'package.json');
    if (Fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(Fs.readFileSync(packageJsonPath, 'utf8')) as {
        type?: unknown;
      };
      const isModule = packageJson.type === 'module';

      for (const visitedDir of visitedDirs) {
        packageTypeCache.set(visitedDir, isModule);
      }

      return isModule;
    }

    const parentDir = Path.dirname(dir);
    if (parentDir === dir) {
      for (const visitedDir of visitedDirs) {
        packageTypeCache.set(visitedDir, false);
      }

      return false;
    }

    dir = parentDir;
  }
};

export const isNodeEsmFile = (sourcePath: string): boolean => {
  if (/\.(?:mjs|mts)$/.test(sourcePath)) {
    return true;
  }

  if (/\.(?:cjs|cts)$/.test(sourcePath)) {
    return false;
  }

  return isModulePackage(sourcePath);
};

export const emitsCommonJs = (sourcePath: string): boolean => !isNodeEsmFile(sourcePath);

export const getNodeEsmExtension = (absolutePath: string): string => {
  switch (Path.extname(absolutePath)) {
    case '.ts':
    case '.tsx':
    case '.js':
    case '.jsx':
      return '.js';
    case '.mts':
    case '.mjs':
      return '.mjs';
    case '.cts':
    case '.cjs':
      return '.cjs';
    default:
      return Path.extname(absolutePath);
  }
};
