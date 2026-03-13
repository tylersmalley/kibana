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
import { ReactLazyDefaultInteropRule } from './react_lazy_default_interop';

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

const inputControlFilename = Path.resolve(
  REPO_ROOT,
  'src/platform/plugins/private/input_control_vis/public/components/editor/index.tsx'
);
const tableOptionsFilename = Path.resolve(
  REPO_ROOT,
  'src/platform/plugins/private/vis_types/table/public/components/table_vis_options_lazy.tsx'
);
const observabilitySharedFilename = Path.resolve(
  REPO_ROOT,
  'x-pack/solutions/observability/plugins/observability_shared/public/components/index.tsx'
);
const nodeEsmFilename = Path.resolve(REPO_ROOT, 'packages/kbn-dependency-usage/src/cli.ts');

for (const [name, tester] of [tsTester, babelTester]) {
  describe(name, () => {
    tester.run('@kbn/imports/react_lazy_default_interop', ReactLazyDefaultInteropRule, {
      valid: [
        {
          filename: tableOptionsFilename,
          code: fmt`
            import React, { lazy } from 'react';

            const TableOptionsComponent = lazy(() =>
              import('./table_vis_options.js').then(({ default: lazyModule }) => ({
                default: lazyModule.default,
              }))
            );
          `,
        },
        {
          filename: nodeEsmFilename,
          code: fmt`
            import React, { lazy } from 'react';

            const LazyDependencyUsage = lazy(() => import('./dependency_graph/providers/cruiser.ts'));
          `,
        },
      ],
      invalid: [
        {
          filename: tableOptionsFilename,
          code: fmt`
            import React, { lazy } from 'react';

            const TableOptionsComponent = lazy(() => import('./table_vis_options.js'));
          `,
          output: fmt`
            import React, { lazy } from 'react';

            const TableOptionsComponent = lazy(() => import('./table_vis_options.js').then(({ default: lazyModule }) => ({ default: lazyModule.default })));
          `,
          errors: [
            {
              message:
                'React.lazy() loaders importing CommonJS TypeScript modules must unwrap the nested default export.',
            },
          ],
        },
        {
          filename: inputControlFilename,
          code: fmt`
            import React, { lazy } from 'react';

            const ControlsTab = lazy(() =>
              import('./controls_tab.js').then(({ default: ControlsTabComponent }) => ({
                default: ControlsTabComponent,
              }))
            );
          `,
          output: fmt`
            import React, { lazy } from 'react';

            const ControlsTab = lazy(() =>
              import('./controls_tab.js').then(({ default: lazyModule }) => ({ default: lazyModule.default }))
            );
          `,
          errors: [
            {
              message:
                'React.lazy() loaders importing CommonJS TypeScript modules must unwrap the nested default export.',
            },
          ],
        },
        {
          filename: observabilitySharedFilename,
          code: fmt`
            import React from 'react';

            const FieldValueSuggestionsLazy = React.lazy(() => import('./field_value_suggestions'));
          `,
          output: fmt`
            import React from 'react';

            const FieldValueSuggestionsLazy = React.lazy(() => import('./field_value_suggestions/index.js').then(({ default: lazyModule }) => ({ default: lazyModule.default })));
          `,
          errors: [
            {
              message:
                'React.lazy() loaders importing CommonJS TypeScript modules must unwrap the nested default export.',
            },
          ],
        },
      ],
    });
  });
}
