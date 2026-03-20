/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import Path from 'path';
import execa from 'execa';

import { REPO_ROOT } from '@kbn/repo-info';
import type { ValidationScope } from '../validation_run_contract';

interface ScopeComparison {
  base: string;
  head: string;
}

type ChangedFilesScope = Exclude<ValidationScope, 'full'>;

export interface GetChangedFilesForScopeOptions {
  scope: ChangedFilesScope;
  comparison?: ScopeComparison;
  includeUntracked?: boolean;
}

const normalizeRepoRelativePath = (pathValue: string) =>
  Path.normalize(pathValue).split(Path.sep).join('/');

const parseDiffNameStatusOutput = (stdout: string) =>
  stdout
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => line.split('\t'))
    .map(([status, ...paths]) => {
      if (status === 'D') {
        return undefined;
      }

      return paths.at(-1);
    })
    .filter((pathValue): pathValue is string => Boolean(pathValue))
    .map(normalizeRepoRelativePath);

const listUntrackedFiles = async () => {
  const { stdout } = await execa('git', ['ls-files', '--others', '--exclude-standard'], {
    cwd: REPO_ROOT,
    stdin: 'ignore',
  });

  return stdout
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map(normalizeRepoRelativePath);
};

const getDiffArgsForScope = (scope: ChangedFilesScope, comparison?: ScopeComparison) => {
  if (scope === 'staged') {
    return ['--cached'];
  }

  if (scope === 'local') {
    return ['HEAD'];
  }

  if (!comparison) {
    throw new Error('comparison is required when resolving branch-scoped changed files.');
  }

  return [comparison.base, comparison.head];
};

/**
 * Returns repository-relative changed file paths for a validation scope.
 *
 * `local` scope includes untracked files by default.
 */
export const getChangedFilesForScope = async ({
  scope,
  comparison,
  includeUntracked = scope === 'local',
}: GetChangedFilesForScopeOptions): Promise<string[]> => {
  const diffArgs = getDiffArgsForScope(scope, comparison);
  const { stdout } = await execa(
    'git',
    ['diff', '--name-status', '--diff-filter=ACMR', ...diffArgs],
    {
      cwd: REPO_ROOT,
      stdin: 'ignore',
    }
  );

  const diffPaths = parseDiffNameStatusOutput(stdout);

  if (!includeUntracked) {
    return [...new Set(diffPaths)].sort((left, right) => left.localeCompare(right));
  }

  const untrackedPaths = await listUntrackedFiles();
  return [...new Set([...diffPaths, ...untrackedPaths])].sort((left, right) =>
    left.localeCompare(right)
  );
};
