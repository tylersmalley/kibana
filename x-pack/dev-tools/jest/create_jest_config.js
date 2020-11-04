/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

export function createJestConfig({ kibanaDirectory, rootDir }) {
  const fileMockPath = `${kibanaDirectory}/packages/kbn-test/target/jest/mocks/file_mock.js`;
  return {
    rootDir,
    roots: ['<rootDir>/plugins'],
    moduleFileExtensions: ['js', 'mjs', 'json', 'ts', 'tsx', 'node'],
    moduleNameMapper: {
      '@elastic/eui$': `${kibanaDirectory}/node_modules/@elastic/eui/test-env`,
      '@elastic/eui/lib/(.*)?': `${kibanaDirectory}/node_modules/@elastic/eui/test-env/$1`,
      '^fixtures/(.*)': `${kibanaDirectory}/src/fixtures/$1`,
      '^src/core/(.*)': `${kibanaDirectory}/src/core/$1`,
      '^src/legacy/(.*)': `${kibanaDirectory}/src/legacy/$1`,
      '^src/plugins/(.*)': `${kibanaDirectory}/src/plugins/$1`,
      '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': fileMockPath,
      '\\.module.(css|scss)$': `${kibanaDirectory}/packages/kbn-test/target/jest/mocks/css_module_mock`,
      '\\.(css|less|scss)$': `${kibanaDirectory}/packages/kbn-test/target/jest/mocks/style_mock`,
      '\\.ace\\.worker.js$': `${kibanaDirectory}/packages/kbn-test/target/jest/mocks/worker_module_mock`,
      '\\.editor\\.worker.js$': `${kibanaDirectory}/packages/kbn-test/target/jest/mocks/worker_module_mock`,
      '^test_utils/enzyme_helpers': `${kibanaDirectory}/packages/kbn-test/target/jest/utils/enzyme_helpers`,
      '^test_utils/find_test_subject': `${kibanaDirectory}/packages/kbn-test/target/jest/utils/find_test_subject`,
      '^test_utils/stub_web_worker': `${kibanaDirectory}/packages/kbn-test/target/jest/utils/stub_web_worker`,
      '^(!!)?file-loader!': fileMockPath,
    },
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
    coveragePathIgnorePatterns: ['.*\\.d\\.ts'],
    coverageDirectory: `${kibanaDirectory}/target/kibana-coverage/jest`,
    coverageReporters: !!process.env.CODE_COVERAGE ? ['json'] : ['html'],
    setupFiles: [
      `${kibanaDirectory}/packages/kbn-test/target/jest/setup/babel_polyfill`,
      `${kibanaDirectory}/packages/kbn-test/target/jest/setup/polyfills`,
      `${kibanaDirectory}/packages/kbn-test/target/jest/setup/enzyme`,
    ],
    setupFilesAfterEnv: [
      `${kibanaDirectory}/packages/kbn-test/target/jest/setup/setup_test`,
      `${kibanaDirectory}/packages/kbn-test/target/jest/setup/mocks`,
      `${kibanaDirectory}/packages/kbn-test/target/jest/setup/react_testing_library`,
    ],
    testEnvironment: 'jest-environment-jsdom-thirteen',
    testMatch: ['**/*.test.{js,mjs,ts,tsx}'],
    testRunner: 'jest-circus/runner',
    transform: {
      '^.+\\.(js|tsx?)$': `${kibanaDirectory}/packages/kbn-test/target/jest/babel_transform`,
      '^.+\\.html?$': 'jest-raw-loader',
    },
    transformIgnorePatterns: [
      // ignore all node_modules except monaco-editor which requires babel transforms to handle dynamic import()
      // since ESM modules are not natively supported in Jest yet (https://github.com/facebook/jest/issues/4842)
      '[/\\\\]node_modules(?![\\/\\\\]monaco-editor)[/\\\\].+\\.js$',
    ],
    snapshotSerializers: [
      `${kibanaDirectory}/node_modules/enzyme-to-json/serializer`,
      `${kibanaDirectory}/src/plugins/kibana_react/public/util/test_helpers/react_mount_serializer.ts`,
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
