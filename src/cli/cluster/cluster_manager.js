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

import { resolve, join } from 'path';
import { debounce, invoke, bindAll, once, uniq } from 'lodash';

import Log from '../log';
import Worker from './worker';
import BasePathProxy from './base_path_proxy';
import { SassBuilder } from './sass_builder';
import { Config } from '../../server/config/config';
import { transformDeprecations } from '../../server/config/transform_deprecations';
import { findPluginSpecs } from '../../plugin_discovery/find_plugin_specs';

process.env.kbnWorkerType = 'managr';

export default class ClusterManager {
  static async create(opts = {}, settings = {}) {
    const transformedSettings = transformDeprecations(settings);
    const config = await Config.withDefaultSchema(transformedSettings);

    return new ClusterManager(opts, config);
  }

  constructor(opts, config) {
    const useUTC = config.get('logging.useUTC');

    this.log = new Log({ quiet: opts.quiet, silent: opts.silent, useUTC });
    this.addedCount = 0;
    this.inReplMode = !!opts.repl;

    const serverArgv = [];
    const optimizerArgv = [
      '--plugins.initialize=false',
      '--server.autoListen=false',
    ];

    if (opts.basePath) {
      this.basePathProxy = new BasePathProxy(this, config);

      optimizerArgv.push(
        `--server.basePath=${this.basePathProxy.basePath}`,
        '--server.rewriteBasePath=true'
      );

      serverArgv.push(
        `--server.port=${this.basePathProxy.targetPort}`,
        `--server.basePath=${this.basePathProxy.basePath}`,
        '--server.rewriteBasePath=true'
      );
    }

    this.workers = [
      (this.optimizer = new Worker({
        type: 'optmzr',
        title: 'optimizer',
        log: this.log,
        argv: optimizerArgv,
        watch: false,
      })),

      (this.server = new Worker({
        type: 'server',
        log: this.log,
        argv: serverArgv,
      })),
    ];

    // broker messages between workers
    this.workers.forEach(worker => {
      worker.on('broadcast', msg => {
        this.workers.forEach(to => {
          if (to !== worker && to.online) {
            to.fork.send(msg);
          }
        });
      });
    });

    bindAll(this, 'onWatcherAdd', 'onWatcherError', 'onWatcherChange');

    if (opts.watch) {
      const pluginPaths = config.get('plugins.paths');
      const scanDirs = config.get('plugins.scanDirs');
      const extraPaths = [...pluginPaths, ...scanDirs];

      const extraIgnores = scanDirs
        .map(scanDir => resolve(scanDir, '*'))
        .concat(pluginPaths)
        .reduce(
          (acc, path) =>
            acc.concat(
              resolve(path, 'test'),
              resolve(path, 'build'),
              resolve(path, 'target'),
              resolve(path, 'scripts'),
              resolve(path, 'docs')
            ),
          []
        );

      this.setupWatching(extraPaths, extraIgnores);
      this.setupScssWatching(pluginPaths, scanDirs);
    } else {
      this.startCluster();
    }
  }

  async setupScssWatching(pluginPaths, scanDirs) {
    const { FSWatcher } = require('chokidar');
    const watcher = new FSWatcher({ ignoreInitial: true });
    const { spec$ } = findPluginSpecs({ plugins: { paths: pluginPaths, scanDirs } });
    const log = this.log;

    function onSuccess(builder) {
      log.format({
        type: 'info',
        message: `Compiled CSS: ${builder.input}`,
        tags: ['scss']
      });
    }

    function onError(builder, error) {
      log.format({
        type: 'error',
        message: `Compiling CSS failed: ${builder.input}`,
        tags: ['scss']
      });
      log.format({
        error,
        type: 'error',
        tags: ['scss']
      });
    }

    const enabledPlugins = await spec$.toArray().toPromise();
    const scssBundles = enabledPlugins.reduce((acc, plugin) => {
      if (plugin.getScss() && plugin.getStyleSheet()) {
        const sassPath = join(plugin.getPath(), plugin.getScss());
        const styleSheetPath = join(plugin.getPublicDir(), plugin.getStyleSheet());

        const builder = new SassBuilder(sassPath, styleSheetPath, { watcher });
        builder.build().then(onSuccess.bind(this, builder)).catch(onError.bind(this, builder));
        builder.addToWatcher();

        return [ ...acc, builder ];
      } else {
        return acc;
      }

      return acc;
    }, []);

    watcher.on('all', async (event, path) => {
      for (let i = 0; i < scssBundles.length; i++) {
        try {
          if (await scssBundles[i].buildIfInPath(path)) {
            onSuccess(scssBundles[i]);
            return;
          }
        } catch(e) {
          onError(scssBundles[i], e);
        }
      }
    });
  }

  startCluster() {
    this.setupManualRestart();
    invoke(this.workers, 'start');
    if (this.basePathProxy) {
      this.basePathProxy.listen();
    }
  }

  setupWatching(extraPaths, extraIgnores) {
    const chokidar = require('chokidar');
    const { fromRoot } = require('../../utils');

    const watchPaths = [
      fromRoot('src/core_plugins'),
      fromRoot('src/server'),
      fromRoot('src/ui'),
      fromRoot('src/utils'),
      fromRoot('x-pack/common'),
      fromRoot('x-pack/plugins'),
      fromRoot('x-pack/server'),
      fromRoot('x-pack/webpackShims'),
      fromRoot('config'),
      ...extraPaths,
    ].map(path => resolve(path));

    this.watcher = chokidar.watch(uniq(watchPaths), {
      cwd: fromRoot('.'),
      ignored: [
        /[\\\/](\..*|node_modules|bower_components|public|__[a-z0-9_]+__|coverage)[\\\/]/,
        /\.test\.js$/,
        /.*\.s(c|a)ss/,
        ...extraIgnores,
      ],
    });

    this.watcher.on('add', this.onWatcherAdd);
    this.watcher.on('error', this.onWatcherError);

    this.watcher.on(
      'ready',
      once(() => {
        // start sending changes to workers
        this.watcher.removeListener('add', this.onWatcherAdd);
        this.watcher.on('all', this.onWatcherChange);

        this.log.info('watching for changes', `(${this.addedCount} files)`);
        this.startCluster();
      })
    );
  }

  setupManualRestart() {
    // If we're in REPL mode, the user can use the REPL to manually restart.
    // The setupManualRestart method interferes with stdin/stdout, in a way
    // that negatively affects the REPL.
    if (this.inReplMode) {
      return;
    }
    const readline = require('readline');
    const rl = readline.createInterface(process.stdin, process.stdout);

    let nls = 0;
    const clear = () => (nls = 0);
    const clearSoon = debounce(clear, 2000);

    rl.setPrompt('');
    rl.prompt();

    rl.on('line', () => {
      nls = nls + 1;

      if (nls >= 2) {
        clearSoon.cancel();
        clear();
        this.server.start();
      } else {
        clearSoon();
      }

      rl.prompt();
    });

    rl.on('SIGINT', () => {
      rl.pause();
      process.kill(process.pid, 'SIGINT');
    });
  }

  onWatcherAdd() {
    this.addedCount += 1;
  }

  onWatcherChange(e, path) {
    invoke(this.workers, 'onChange', path);
  }

  onWatcherError(err) {
    this.log.error('failed to watch files!\n', err.stack);
    process.exit(1); // eslint-disable-line no-process-exit
  }
}
