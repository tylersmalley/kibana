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

import getopts from 'getopts';
import dedent from 'dedent';
import chalk from 'chalk';

import { createToolingLog, pickLevelFromFlags } from '@kbn/dev-utils';
import { buildPluginDistributable } from './build_plugin_distributable';
import { isErrorLogged } from './lib';
import { version as kibanaVersion } from '../../../package.json';

const unknownFlags = [];
const flags = getopts(process.argv.slice(0), {
  boolean: [
    'skip-archive',
  ],
  alias: {
    v: 'verbose',
    d: 'debug',
  },
  unknown: (flag) => {
    unknownFlags.push(flag);
  }
});

if (unknownFlags.length && !flags.help) {
  const pluralized = unknownFlags.length > 1 ? 'flags' : 'flag';
  console.log(chalk`\n{red Unknown ${pluralized}: ${unknownFlags.join(', ')}}\n`);
  flags.help = true;
}

if (flags.help) {
  console.log(
    dedent(chalk`
      {dim usage:} node scripts/build_plugin

      build a plugin distributable

      options:
        --build-destination <path>  {dim Target path for the build output, absolute or relative to the plugin root}
        --build-version <version>   {dim Version for the build output}
        --kibana-version            {dim Version of Kibana}
        --skip-archive              {dim Kibana version for the build output}
    `) + '\n'
  );
  process.exit(1);
}

const log = createToolingLog(pickLevelFromFlags(flags));
log.pipe(process.stdout);

buildPluginDistributable({
  log,
  path: process.cwd(),
  target: flags.target,
  skipArchive: Boolean(flags.skipArchive),
  kibanaVersion,
}).catch(error => {
  if (!isErrorLogged(error)) {
    log.error('Uncaught error');
    log.error(error);
  }

  process.exit(1);
});
