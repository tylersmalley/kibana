/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

// For a detailed explanation regarding each configuration property, visit:
// https://jestjs.io/docs/en/configuration.html

const { resolve } = require('path');

module.exports = {
  // All imported modules in your tests should be mocked automatically
  // automock: false,

  // Stop running tests after `n` failures
  // bail: 0,

  // Respect "browser" field in package.json when resolving modules
  // browser: false,

  // The directory where Jest should store its cached dependency information
  // cacheDirectory: "/tmp/jest_rs",

  // Automatically clear mock calls and instances between every test
  // clearMocks: true,

  // Indicates whether the coverage information should be collected while executing the test
  // collectCoverage: false,

  // An array of glob patterns indicating a set of files for which coverage information should be collected
  // collectCoverageFrom: undefined,

  // The directory where Jest should output its coverage files
  coverageDirectory: '<rootDir>/target/kibana-coverage/jest',

  // An array of regexp pattern strings used to skip coverage collection
  coveragePathIgnorePatterns: ['/node_modules/', '.*\\.d\\.ts'],

  // A list of reporter names that Jest uses when writing coverage reports
  coverageReporters: !!process.env.CODE_COVERAGE ? ['json'] : ['html', 'text'],

  // An object that configures minimum threshold enforcement for coverage results
  // coverageThreshold: undefined,

  // A path to a custom dependency extractor
  // dependencyExtractor: undefined,

  // Make calling deprecated APIs throw helpful error messages
  // errorOnDeprecated: false,

  // Force coverage collection from ignored files using an array of glob patterns
  // forceCoverageMatch: [],

  // A path to a module which exports an async function that is triggered once before all test suites
  // globalSetup: undefined,

  // A path to a module which exports an async function that is triggered once after all test suites
  // globalTeardown: undefined,

  // A set of global variables that need to be available in all test environments
  // globals: {},

  // The maximum amount of workers used to run your tests. Can be specified as % or a number.
  // E.g. maxWorkers: 10% will use 10% of your CPU amount + 1 as the maximum worker number. maxWorkers: 2 will use a maximum of 2 workers.
  // maxWorkers: "50%",

  // An array of directory names to be searched recursively up from the requiring module's location
  // moduleDirectories: [
  //   "node_modules"
  // ],

  // An array of file extensions your modules use
  moduleFileExtensions: ['js', 'mjs', 'json', 'ts', 'tsx', 'node'],

  // A map from regular expressions to module names or to arrays of module names that allow to stub out resources with a single module
  moduleNameMapper: {
    '@elastic/eui/lib/(.*)?': '<rootDir>/node_modules/@elastic/eui/test-env/$1',
    '@elastic/eui$': '<rootDir>/node_modules/@elastic/eui/test-env',
    '\\.(css|less|scss)$': '<rootDir>/packages/kbn-test/target/jest/mocks/style_mock.js',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/packages/kbn-test/target/jest/mocks/file_mock.js',
    '\\.ace\\.worker.js$': '<rootDir>/packages/kbn-test/target/jest/mocks/worker_module_mock.js',
    '\\.editor\\.worker.js$': '<rootDir>/packages/kbn-test/target/jest/mocks/worker_module_mock.js',
    '\\.module.(css|scss)$': '<rootDir>/packages/kbn-test/target/jest/mocks/css_module_mock.js',
    '^(!!)?file-loader!': '<rootDir>/packages/kbn-test/target/jest/mocks/file_mock.js',
    '^fixtures/(.*)': '<rootDir>/src/fixtures/$1',
    '^src/core/(.*)': '<rootDir>/src/core/$1',
    '^src/legacy/(.*)': '<rootDir>/src/legacy/$1',
    '^src/plugins/(.*)': '<rootDir>/src/plugins/$1',
  },

  // An array of regexp pattern strings, matched against all module paths before considered 'visible' to the module loader
  modulePathIgnorePatterns: ['__fixtures__/', 'target/'],

  // Activates notifications for test results
  // notify: false,

  // An enum that specifies notification mode. Requires { notify: true }
  // notifyMode: "failure-change",

  // A preset that is used as a base for Jest's configuration
  // preset: undefined,

  // Run tests from one or more projects
  // projects: undefined,

  // Use this configuration option to add custom reporters to Jest
  reporters: ['default', resolve(__dirname, './target/jest/junit_reporter')],

  // Automatically reset mock state between every test
  // resetMocks: false,

  // Reset the module registry before running each individual test
  // resetModules: false,

  // A path to a custom resolver
  // resolver: undefined,

  // Automatically restore mock state between every test
  // restoreMocks: false,

  // The root directory that Jest should scan for tests and modules within
  // rootDir: __dirname,

  // Allows you to use a custom runner instead of Jest's default test runner
  // runner: "jest-runner",

  // The paths to modules that run some code to configure or set up the testing environment before each test
  setupFiles: [
    '<rootDir>/packages/kbn-test/target/jest/setup/babel_polyfill.js',
    '<rootDir>/packages/kbn-test/target/jest/setup/polyfills.js',
    '<rootDir>/packages/kbn-test/target/jest/setup/enzyme.js',
  ],

  // A list of paths to modules that run some code to configure or set up the testing framework before each test
  setupFilesAfterEnv: [
    '<rootDir>/packages/kbn-test/target/jest/setup/setup_test.js',
    '<rootDir>/packages/kbn-test/target/jest/setup/mocks.js',
    '<rootDir>/packages/kbn-test/target/jest/setup/react_testing_library.js',
  ],

  // A list of paths to snapshot serializer modules Jest should use for snapshot testing
  snapshotSerializers: [
    '<rootDir>/src/plugins/kibana_react/public/util/test_helpers/react_mount_serializer.ts',
    '<rootDir>/node_modules/enzyme-to-json/serializer',
  ],

  // The test environment that will be used for testing
  testEnvironment: 'jest-environment-jsdom-thirteen',

  // Options that will be passed to the testEnvironment
  // testEnvironmentOptions: {},

  // Adds a location field to test results
  // testLocationInResults: false,

  // The glob patterns Jest uses to detect test files
  testMatch: ['**/*.test.{js,mjs,ts,tsx}'],

  // An array of regexp pattern strings that are matched against all test paths, matched tests are skipped
  testPathIgnorePatterns: [
    '<rootDir>/packages/kbn-ui-framework/(dist|doc_site|generator-kui)/',
    '<rootDir>/packages/kbn-pm/dist/',
    `integration_tests/`,
  ],

  // The regexp pattern or array of patterns that Jest uses to detect test files
  // testRegex: [],

  // This option allows the use of a custom results processor
  // testResultsProcessor: undefined,

  // This option allows use of a custom test runner
  testRunner: 'jest-circus/runner',

  // This option sets the URL for the jsdom environment. It is reflected in properties such as location.href
  // testURL: "http://localhost",

  // Setting this value to "fake" allows the use of fake timers for functions such as "setTimeout"
  // timers: "real",

  // A map from regular expressions to paths to transformers
  transform: {
    '^.+\\.(js|tsx?)$': '<rootDir>/packages/kbn-test/target/jest/babel_transform.js',
    '^.+\\.txt?$': 'jest-raw-loader',
    '^.+\\.html?$': 'jest-raw-loader',
  },

  // An array of regexp pattern strings that are matched against all source file paths, matched files will skip transformation
  transformIgnorePatterns: [
    // ignore all node_modules except monaco-editor which requires babel transforms to handle dynamic import()
    // since ESM modules are not natively supported in Jest yet (https://github.com/facebook/jest/issues/4842)
    '[/\\\\]node_modules(?![\\/\\\\]monaco-editor)[/\\\\].+\\.js$',
    'packages/kbn-pm/dist/index.js',
  ],

  // An array of regexp pattern strings that are matched against all modules before the module loader will automatically return a mock for them
  // unmockedModulePathPatterns: undefined,

  // Indicates whether each individual test should be reported during the run
  // verbose: undefined,

  // An array of regexp patterns that are matched against all source file paths before re-running tests in watch mode
  // watchPathIgnorePatterns: [],

  // Whether to use watchman for file crawling
  // watchman: true,
};
