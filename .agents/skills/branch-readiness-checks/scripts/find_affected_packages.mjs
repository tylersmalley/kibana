#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import process from 'node:process';

import { parse } from 'jsonc-parser';

const run = (command, args) =>
  execFileSync(command, args, {
    cwd: process.cwd(),
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();

const tryRun = (command, args) => {
  try {
    return run(command, args);
  } catch {
    return '';
  }
};

const getRepoRoot = () => run('git', ['rev-parse', '--show-toplevel']);

const getBase = () => {
  const mergeBaseMain = tryRun('git', ['merge-base', 'HEAD', 'main']);
  if (mergeBaseMain) {
    return mergeBaseMain;
  }

  const mergeBaseOriginMain = tryRun('git', ['merge-base', 'HEAD', 'origin/main']);
  if (mergeBaseOriginMain) {
    return mergeBaseOriginMain;
  }

  throw new Error('Could not determine branch base from main or origin/main');
};

const getChangedFiles = (base) => {
  const tracked = tryRun('git', ['diff', '--name-only', base])
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const untracked = tryRun('git', ['ls-files', '--others', '--exclude-standard'])
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  return Array.from(new Set([...tracked, ...untracked])).sort();
};

const readManifestId = (manifestPath) => {
  const manifest = parse(readFileSync(manifestPath, 'utf8'));
  return manifest?.id;
};

const findOwningModule = (repoRoot, relPath) => {
  let currentDir = dirname(resolve(repoRoot, relPath));

  while (currentDir.startsWith(repoRoot)) {
    const manifestPath = join(currentDir, 'kibana.jsonc');
    if (existsSync(manifestPath)) {
      const id = readManifestId(manifestPath);
      if (typeof id === 'string' && id.length > 0) {
        const tsconfigPath = join(currentDir, 'tsconfig.json');
        return {
          id,
          root: relative(repoRoot, currentDir),
          kibanaJsonc: relative(repoRoot, manifestPath),
          tsconfig: existsSync(tsconfigPath) ? relative(repoRoot, tsconfigPath) : null,
        };
      }
      return null;
    }

    const parentDir = dirname(currentDir);
    if (parentDir === currentDir) {
      break;
    }
    currentDir = parentDir;
  }

  return null;
};

const listDownstreamTsconfigs = (repoRoot, packageIds) => {
  if (packageIds.length === 0) {
    return [];
  }

  const matches = new Set();

  for (const packageId of packageIds) {
    const result = tryRun('rg', ['-l', `"${packageId}"`, '--glob', 'tsconfig.json', '.']);
    for (const line of result.split('\n').map((value) => value.trim()).filter(Boolean)) {
      const relPath = line.startsWith('./') ? line.slice(2) : line;
      matches.add(relPath);
    }
  }

  return Array.from(matches).sort();
};

const printHuman = (summary) => {
  console.log(`base: ${summary.base}`);
  console.log(`changed files: ${summary.changedFiles.length}`);
  for (const file of summary.changedFiles) {
    console.log(`  - ${file}`);
  }

  console.log(`affected packages: ${summary.affectedPackages.length}`);
  for (const pkg of summary.affectedPackages) {
    console.log(`  - ${pkg.id}`);
    console.log(`    root: ${pkg.root}`);
    console.log(`    kibana.jsonc: ${pkg.kibanaJsonc}`);
    console.log(`    tsconfig: ${pkg.tsconfig ?? '(none)'}`);
  }

  console.log(`downstream tsconfigs: ${summary.downstreamTsconfigs.length}`);
  for (const tsconfig of summary.downstreamTsconfigs) {
    console.log(`  - ${tsconfig}`);
  }
};

const repoRoot = getRepoRoot();
process.chdir(repoRoot);

const base = getBase();
const changedFiles = getChangedFiles(base);
const affectedPackagesByRoot = new Map();

for (const changedFile of changedFiles) {
  const owningModule = findOwningModule(repoRoot, changedFile);
  if (owningModule !== null) {
    affectedPackagesByRoot.set(owningModule.root, owningModule);
  }
}

const affectedPackages = Array.from(affectedPackagesByRoot.values()).sort((left, right) =>
  left.root.localeCompare(right.root)
);
const affectedPackageIds = affectedPackages.map(({ id }) => id);
const downstreamTsconfigs = listDownstreamTsconfigs(repoRoot, affectedPackageIds).filter(
  (tsconfig) => !affectedPackages.some(({ tsconfig: ownTsconfig }) => ownTsconfig === tsconfig)
);

const summary = {
  repoRoot,
  base,
  changedFiles,
  affectedPackages,
  downstreamTsconfigs,
};

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(summary, null, 2));
} else {
  printHuman(summary);
}
