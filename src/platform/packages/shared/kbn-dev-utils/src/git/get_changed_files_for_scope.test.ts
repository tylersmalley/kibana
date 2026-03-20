/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import execa from 'execa';

import { getChangedFilesForScope } from './get_changed_files_for_scope';

jest.mock('execa');
jest.mock('@kbn/repo-info', () => ({
  REPO_ROOT: '/repo',
}));

const mockExeca = execa as unknown as jest.Mock;

describe('getChangedFilesForScope', () => {
  beforeEach(() => {
    mockExeca.mockReset();
  });

  it('returns staged diff files and handles renames', async () => {
    mockExeca.mockResolvedValue({
      stdout: ['A\tpackages/foo/src/new.ts', 'R100\told/path.ts\tpackages/foo/src/renamed.ts'].join(
        '\n'
      ),
    });

    await expect(
      getChangedFilesForScope({
        scope: 'staged',
      })
    ).resolves.toEqual(['packages/foo/src/new.ts', 'packages/foo/src/renamed.ts']);

    expect(mockExeca).toHaveBeenCalledWith(
      'git',
      ['diff', '--name-status', '--diff-filter=ACMR', '--cached'],
      expect.objectContaining({ cwd: '/repo' })
    );
  });

  it('includes untracked files by default for local scope', async () => {
    mockExeca
      .mockResolvedValueOnce({
        stdout: 'M\tpackages/foo/src/changed.ts',
      })
      .mockResolvedValueOnce({
        stdout: 'packages/foo/src/untracked.ts',
      });

    await expect(
      getChangedFilesForScope({
        scope: 'local',
      })
    ).resolves.toEqual(['packages/foo/src/changed.ts', 'packages/foo/src/untracked.ts']);

    expect(mockExeca).toHaveBeenNthCalledWith(
      1,
      'git',
      ['diff', '--name-status', '--diff-filter=ACMR', 'HEAD'],
      expect.objectContaining({ cwd: '/repo' })
    );
    expect(mockExeca).toHaveBeenNthCalledWith(
      2,
      'git',
      ['ls-files', '--others', '--exclude-standard'],
      expect.objectContaining({ cwd: '/repo' })
    );
  });

  it('can skip untracked files in local scope', async () => {
    mockExeca.mockResolvedValue({
      stdout: 'M\tpackages/foo/src/changed.ts',
    });

    await expect(
      getChangedFilesForScope({
        scope: 'local',
        includeUntracked: false,
      })
    ).resolves.toEqual(['packages/foo/src/changed.ts']);

    expect(mockExeca).toHaveBeenCalledTimes(1);
  });

  it('uses provided comparison for branch scope', async () => {
    mockExeca.mockResolvedValue({
      stdout: 'M\tpackages/foo/src/changed.ts',
    });

    await expect(
      getChangedFilesForScope({
        scope: 'branch',
        comparison: {
          base: 'base-sha',
          head: 'head-sha',
        },
        includeUntracked: false,
      })
    ).resolves.toEqual(['packages/foo/src/changed.ts']);

    expect(mockExeca).toHaveBeenCalledWith(
      'git',
      ['diff', '--name-status', '--diff-filter=ACMR', 'base-sha', 'head-sha'],
      expect.objectContaining({ cwd: '/repo' })
    );
  });

  it('throws for branch scope without a comparison', async () => {
    await expect(
      getChangedFilesForScope({
        scope: 'branch',
      })
    ).rejects.toThrow('comparison is required when resolving branch-scoped changed files.');
  });
});
