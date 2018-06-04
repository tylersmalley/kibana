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

import path from 'path';
import { FSWatcher } from 'chokidar';
import { SassBuilder } from '../../../cli/cluster/sass_builder';
import { findPluginSpecs } from '../../../plugin_discovery/find_plugin_specs';

export const TranspileScssTask = {
  description: 'Transpiling SCSS to CSS',

  async run(config, log, build) {
    const scanDirs = [ build.resolvePath('src/core_plugins') ];
    const watcher = new FSWatcher({ ignoreInitial: true });
    const { spec$ } = findPluginSpecs({ plugins: { scanDirs, paths: [] } });

    const enabledPlugins = await spec$.toArray().toPromise();

    await Promise.all(enabledPlugins.map(async plugin => {
      if (plugin.getScss() && plugin.getStyleSheet()) {
        const sassPath = path.join(plugin.getPath(), plugin.getScss());
        const styleSheetPath = path.join(plugin.getPublicDir(), plugin.getStyleSheet());

        const builder = new SassBuilder(sassPath, styleSheetPath, { watcher, log });
        await builder.build();
      }
    }));
  }
};