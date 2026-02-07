/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

const eslintPlugin = require('../../../../packages/kbn-eslint-plugin-eslint/index.js');

module.exports = {
  meta: {
    name: '@kbn/eslint',
  },
  rules: {
    deployment_agnostic_test_context: eslintPlugin.rules.deployment_agnostic_test_context,
    no_constructor_args_in_property_initializers:
      eslintPlugin.rules.no_constructor_args_in_property_initializers,
    no_this_in_property_initializers: eslintPlugin.rules.no_this_in_property_initializers,
    no_unsafe_console: eslintPlugin.rules.no_unsafe_console,
    no_unsafe_hash: eslintPlugin.rules.no_unsafe_hash,
    no_wrapped_error_in_logger: eslintPlugin.rules.no_wrapped_error_in_logger,
    require_include_in_check_a11y: eslintPlugin.rules.require_include_in_check_a11y,
    scout_max_one_describe: eslintPlugin.rules.scout_max_one_describe,
    scout_no_describe_configure: eslintPlugin.rules.scout_no_describe_configure,
    scout_no_es_archiver_in_parallel_tests:
      eslintPlugin.rules.scout_no_es_archiver_in_parallel_tests,
    scout_require_api_client_in_api_test:
      eslintPlugin.rules.scout_require_api_client_in_api_test,
    scout_require_global_setup_hook_in_parallel_tests:
      eslintPlugin.rules.scout_require_global_setup_hook_in_parallel_tests,
  },
};
