/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import execa from 'execa';

import { REPO_ROOT } from '@kbn/repo-info';
import { createFailError } from '@kbn/dev-cli-errors';
import type { ToolingLog } from '@kbn/tooling-log';
import type { File } from '../file';
import { oxlintBinPath } from './oxlint_bin_path';

export async function lintFiles(log: ToolingLog, files: File[], { fix }: { fix?: boolean } = {}) {
  if (!files.length) {
    return;
  }

  const paths = files.map((file) => file.getRelativePath());
  const args = [oxlintBinPath, '--config', '.oxlintrc.json', ...(fix ? ['--fix'] : []), ...paths];
  const { stdout, stderr, exitCode } = await execa('node', args, {
    cwd: REPO_ROOT,
    reject: false,
  });

  if (exitCode !== 0) {
    log.error(stdout || stderr);
    throw createFailError('[oxlint] errors');
  }

  const customRules = await execa('node', ['scripts/lint_custom_rules', ...paths], {
    cwd: REPO_ROOT,
    reject: false,
  });

  if (customRules.exitCode !== 0) {
    log.error(customRules.stdout || customRules.stderr);
    throw createFailError('[custom lint rules] errors');
  }

  log.success('[oxlint] %d files linted successfully', files.length);
}
