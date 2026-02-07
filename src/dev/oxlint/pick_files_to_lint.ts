/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import type { ToolingLog } from '@kbn/tooling-log';
import type { File } from '../file';

const lintableFilePattern = /\.(js|mjs|ts|tsx)$/;

export async function pickFilesToLint(log: ToolingLog, files: File[]) {
  const filesToLint = [];

  for (const file of files) {
    const path = file.getRelativePath();
    if (!lintableFilePattern.test(path)) {
      continue;
    }

    log.debug('[oxlint] linting %j', file);
    filesToLint.push(file);
  }

  return filesToLint;
}
