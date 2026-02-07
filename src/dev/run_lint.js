/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import execa from 'execa';
import { run } from '@kbn/dev-cli-runner';
import { REPO_ROOT } from '@kbn/repo-info';

import { oxlintBinPath } from './oxlint';

process.env.KIBANA_RESOLVER_HARD_CACHE = 'true';

run(
  async () => {
    const args = [];
    const rawArgs = process.argv.slice(2);
    const hasVerbose = rawArgs.includes('--verbose');
    const hasHelpArg = rawArgs.includes('--help') || rawArgs.includes('-h');
    let hasConfigArg = false;
    let hasIgnorePathArg = false;
    let hasNoIgnoreArg = false;
    let hasPositional = false;
    let hasQuietArg = false;
    let skipCustomRules = false;
    const positionalArgs = [];

    for (let i = 0; i < rawArgs.length; i++) {
      const arg = rawArgs[i];

      if (arg === '--verbose' || arg === '--cache' || arg === '--no-cache') {
        continue;
      }
      if (arg === '--skip-custom-rules') {
        skipCustomRules = true;
        continue;
      }
      if (arg === '--ext') {
        i += 1;
        continue;
      }
      if (arg.startsWith('--ext=')) {
        continue;
      }

      if (arg === '--config' || arg === '-c' || arg.startsWith('--config=')) {
        hasConfigArg = true;
      }
      if (arg === '--ignore-path' || arg.startsWith('--ignore-path=')) {
        hasIgnorePathArg = true;
      }
      if (arg === '--no-ignore') {
        hasNoIgnoreArg = true;
      }
      if (arg === '--quiet' || arg === '--silent') {
        hasQuietArg = true;
      }
      if (!arg.startsWith('-')) {
        hasPositional = true;
        positionalArgs.push(arg);
      }

      args.push(arg);
    }

    if (!hasConfigArg) {
      args.unshift('--config', '.oxlintrc.json');
    }

    // oxlint's `--ignore-path` points to a file that *defines* ignored paths.
    // Using `.gitignore` here means lint respects repository ignore patterns.
    if (!hasIgnorePathArg && !hasNoIgnoreArg) {
      args.unshift('--ignore-path', '.gitignore');
    }

    if (!hasVerbose && !hasQuietArg) {
      args.unshift('--quiet');
    }

    if (!hasPositional) {
      args.push('.');
    }

    const { stdout, stderr, exitCode } = await execa('node', [oxlintBinPath, ...args], {
      cwd: REPO_ROOT,
      reject: false,
    });

    if (stdout) {
      process.stdout.write(stdout.endsWith('\n') ? stdout : `${stdout}\n`);
    }
    if (stderr) {
      process.stderr.write(stderr.endsWith('\n') ? stderr : `${stderr}\n`);
    }
    if (exitCode === 0) {
      if (!skipCustomRules && !hasHelpArg) {
        const customRuleArgs = hasPositional ? positionalArgs : [];
        if (hasQuietArg) {
          customRuleArgs.unshift('--quiet');
        }

        const customRuleResult = await execa('node', ['scripts/lint_custom_rules', ...customRuleArgs], {
          cwd: REPO_ROOT,
          reject: false,
        });

        if (customRuleResult.stdout) {
          process.stdout.write(
            customRuleResult.stdout.endsWith('\n')
              ? customRuleResult.stdout
              : `${customRuleResult.stdout}\n`
          );
        }

        if (customRuleResult.stderr) {
          process.stderr.write(
            customRuleResult.stderr.endsWith('\n')
              ? customRuleResult.stderr
              : `${customRuleResult.stderr}\n`
          );
        }

        if (customRuleResult.exitCode !== 0) {
          process.exit(customRuleResult.exitCode ?? 1);
        }
      }

      console.log('✅ no oxlint errors found');
    }

    process.exit(exitCode ?? 1);
  },
  {
    description: 'Run OXlint on JavaScript/TypeScript files in the repository',
    usage: 'node scripts/lint.js [options] [<file>...]',
    flags: {
      allowUnexpected: true,
      boolean: ['cache', 'fix', 'quiet', 'silent', 'skip-custom-rules', 'type-aware'],
      string: ['ext', 'config', 'tsconfig'],
    },
  }
);
