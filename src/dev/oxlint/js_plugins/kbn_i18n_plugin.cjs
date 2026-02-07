/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

require('@kbn/babel-register/install');

const { rules } = require('../../../../packages/kbn-eslint-plugin-i18n/index.ts');

module.exports = {
  meta: {
    name: '@kbn/i18n',
  },
  rules: {
    formatted_message_should_start_with_the_right_id:
      rules.formatted_message_should_start_with_the_right_id,
    i18n_translate_should_start_with_the_right_id:
      rules.i18n_translate_should_start_with_the_right_id,
    strings_should_be_translated_with_formatted_message:
      rules.strings_should_be_translated_with_formatted_message,
    strings_should_be_translated_with_i18n: rules.strings_should_be_translated_with_i18n,
  },
};
