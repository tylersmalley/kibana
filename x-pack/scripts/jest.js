/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

process.argv.push('--config', require('path').resolve(__dirname, '../jest.config.js'));

require('../../src/setup_node_env');
require('../../src/dev/jest/cli');
