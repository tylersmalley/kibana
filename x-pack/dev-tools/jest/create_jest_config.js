/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

export function createJestConfig({ kibanaDirectory, rootDir }) {
  return {
    preset: '@kbn/test',
    rootDir: kibanaDirectory,
    roots: [`${rootDir}/plugins`],
    collectCoverageFrom: [
      'plugins/**/*.{js,mjs,jsx,ts,tsx}',
      '!**/{__test__,__snapshots__,__examples__,integration_tests,tests}/**',
      '!**/*.test.{js,mjs,ts,tsx}',
      '!**/flot-charts/**',
      '!**/test/**',
      '!**/build/**',
      '!**/scripts/**',
      '!**/mocks/**',
      '!**/plugins/apm/e2e/**',
      '!**/plugins/siem/cypress/**',
      '!**/plugins/**/test_helpers/**',
    ],
    reporters: [
      'default',
      [
        `${kibanaDirectory}/packages/kbn-test/target/jest/junit_reporter`,
        {
          reportName: 'X-Pack Jest Tests',
        },
      ],
    ],
  };
}
