/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import execa from 'execa';
import globby from 'globby';
import Path from 'path';
import { REPO_ROOT } from '@kbn/repo-info';

export async function fixLint(path: string) {
  const pattern = Path.relative(REPO_ROOT, path);
  const files = await globby([pattern], {
    cwd: REPO_ROOT,
    expandDirectories: false,
    onlyFiles: true,
  });

  if (!files.length) {
    return;
  }

  await execa('node', ['scripts/lint', '--fix', ...files], {
    cwd: REPO_ROOT,
  });
}
