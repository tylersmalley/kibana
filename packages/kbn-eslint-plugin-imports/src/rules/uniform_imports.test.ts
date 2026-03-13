/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import Path from 'path';
import dedent from 'dedent';
import { RuleTester } from 'eslint';
import { REPO_ROOT } from '@kbn/repo-info';
import { UniformImportsRule } from './uniform_imports';

const fmt = (str: TemplateStringsArray) => dedent(str) + '\n';

const tsTester = [
  '@typescript-eslint/parser',
  new RuleTester({
    parser: require.resolve('@typescript-eslint/parser'),
    parserOptions: {
      sourceType: 'module',
      ecmaVersion: 2018,
      ecmaFeatures: {
        jsx: true,
      },
    },
  }),
] as const;

const babelTester = [
  '@babel/eslint-parser',
  new RuleTester({
    parser: require.resolve('@babel/eslint-parser'),
    parserOptions: {
      sourceType: 'module',
      ecmaVersion: 2018,
      requireConfigFile: false,
      babelOptions: {
        presets: ['@kbn/babel-preset/node_preset'],
      },
    },
  }),
] as const;

const commonJsFilename = Path.resolve(
  REPO_ROOT,
  'examples/content_management_examples/server/index.ts'
);
const commonJsDynamicImportFilename = Path.resolve(
  REPO_ROOT,
  'examples/content_management_examples/public/plugin.ts'
);
const nodeEsmFilename = Path.resolve(REPO_ROOT, 'packages/kbn-dependency-usage/src/cli.ts');
const nodeEsmExportFilename = Path.resolve(
  REPO_ROOT,
  'packages/kbn-dependency-usage/src/dependency_graph/index.ts'
);
const tableVisTypeFilename = Path.resolve(
  REPO_ROOT,
  'src/platform/plugins/private/vis_types/table/public/table_vis_type.ts'
);

for (const [name, tester] of [tsTester, babelTester]) {
  describe(name, () => {
    tester.run('@kbn/imports/uniform_imports', UniformImportsRule, {
      valid: [
        {
          filename: commonJsFilename,
          code: fmt`
            export { plugin } from './plugin';
          `,
        },
        {
          filename: commonJsFilename,
          code: fmt`
            export { plugin } from './plugin.js';
          `,
        },
        {
          filename: commonJsDynamicImportFilename,
          code: fmt`
            const app = await import('./examples/index.js');
          `,
        },
        {
          filename: nodeEsmFilename,
          code: fmt`
            import { configureYargs } from './cli.ts';
            export { configureYargs };
          `,
        },
      ],
      invalid: [
        {
          filename: commonJsDynamicImportFilename,
          code: fmt`
            const app = await import('./examples');
          `,
          output: fmt`
            const app = await import('./examples/index.js');
          `,
          errors: [{ message: 'Use import request [./examples/index.js]' }],
        },
        {
          filename: commonJsFilename,
          code: fmt`
            const plugin = await import('./plugin');
          `,
          output: fmt`
            const plugin = await import('./plugin.js');
          `,
          errors: [{ message: 'Use import request [./plugin.js]' }],
        },
        {
          filename: nodeEsmExportFilename,
          code: fmt`
            export { identifyDependencyUsageWithCruiser } from './providers/cruiser';
          `,
          output: fmt`
            export { identifyDependencyUsageWithCruiser } from './providers/cruiser.js';
          `,
          errors: [{ message: 'Use import request [./providers/cruiser.js]' }],
        },
        {
          filename: tableVisTypeFilename,
          code: fmt`
            const convertToLens = await import('./convert_to_lens');
          `,
          output: fmt`
            const convertToLens = await import('./convert_to_lens/index.js');
          `,
          errors: [{ message: 'Use import request [./convert_to_lens/index.js]' }],
        },
      ],
    });
  });
}
