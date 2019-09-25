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

const path = require('path');
const os = require('os');
const { withProcRunner } = require('@kbn/dev-utils')
const { createCliError } = require('../errors');
const { findMostRecentlyChanged } = require('../utils');
const { GRADLE_BIN } = require('../paths');

/**
 * Creates archive from source
 *
 * @param {Object} options
 * @property {('oss'|'basic'|'trial')} options.license
 * @property {String} options.sourcePath
 * @property {ToolingLog} options.log
 * @returns {Object} containing archive and optional plugins
 *
 * Gradle tasks:
 *   :distribution:archives:darwin-tar:assemble
 *   :distribution:archives:linux-tar:assemble
 *   :distribution:archives:windows-zip:assemble
 *   :distribution:archives:oss-darwin-tar:assemble
 *   :distribution:archives:oss-linux-tar:assemble
 *   :distribution:archives:oss-windows-zip:assemble
 */
exports.buildSnapshot = async ({ license, sourcePath, log, platform = os.platform() }) => {
  const { task, ext } = exports.archiveForPlatform(platform, license);
  const buildArgs = [`:distribution:archives:${task}:assemble`];

  log.info('%s %s', GRADLE_BIN, buildArgs.join(' '));
  log.debug('cwd:', sourcePath);

  try {
    await withProcRunner(log, async proc => {
      await Promise.all([
        proc.run('es', {
          cmd: GRADLE_BIN,
          args: buildArgs,
          wait: true,
          cwd: sourcePath
        }),
      ]);
  
      log.success('Complete');
    });
  } catch (e) {
    log.error(e);
    throw createCliError('unable to build ES');
  }
  
  const archivePattern = `distribution/archives/${task}/build/distributions/elasticsearch-*.${ext}`;
  const esArchivePath = findMostRecentlyChanged(path.resolve(sourcePath, archivePattern));

  if (!esArchivePath) {
    throw createCliError('could not locate ES distribution');
  }

  return esArchivePath;
};

exports.archiveForPlatform = (platform, license) => {
  const taskPrefix = license === 'oss' ? 'oss-' : '';

  switch (platform) {
    case 'darwin':
      return { format: 'tar', ext: 'tar.gz', task: `${taskPrefix}darwin-tar`, platform: 'darwin' };
    case 'win32':
      return { format: 'zip', ext: 'zip', task: `${taskPrefix}windows-zip`, platform: 'windows' };
    case 'linux':
      return { format: 'tar', ext: 'tar.gz', task: `${taskPrefix}linux-tar`, platform: 'linux' };
    default:
      throw new Error(`unknown platform: ${platform}`);
  }
};
