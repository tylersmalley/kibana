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

import { format } from 'util';
import { includes } from 'lodash';

export default class Log {
  constructor(quiet, silent) {
    const KbnLoggerStringFormat = require('../server/logging/log_format_string');
    const logger = new KbnLoggerStringFormat();

    this.log = (data = {}) => {
      if (silent) {
        return;
      }

      if (quiet && includes(['info', 'warning'], data.type)) {
        return;
      }

      console.log(logger.format(data));
    };

    this.info = (...msg) =>
      this.log({ type: 'info', message: format(...msg) });

    this.warning = (...msg) =>
      this.log({ type: 'warning', message: format(...msg) });

    this.error = error => this.log({ type: 'error', error });
  }
}
