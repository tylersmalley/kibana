import { merge } from 'lodash';
import { fromRoot } from '../../utils';
import KbnServer from '../../server/kbn_server';
import readYamlConfig from '../../cli/serve/read_yaml_config';
import { versionSatisfies, cleanVersion } from '../../utils/version';
import { statSync } from 'fs';
import path from 'path';

export function existingInstall(pluginDir, plugin, logger) {
  try {
    statSync(path.join(pluginDir, plugin.name));

    logger.error(`Plugin ${plugin.name} already exists, please remove before installing a new version`);
    process.exit(70); // eslint-disable-line no-process-exit
  } catch (e) {
    if (e.code !== 'ENOENT') throw e;
  }
}

export async function rebuildCache(settings, logger) {
  logger.log('Optimizing and caching browser bundles...');
  const serverConfig = merge(
    readYamlConfig(settings.config),
    {
      env: 'production',
      logging: {
        silent: settings.silent,
        quiet: !settings.silent,
        verbose: false
      },
      optimize: {
        useBundleCache: false
      },
      server: {
        autoListen: false
      },
      plugins: {
        initialize: false,
        scanDirs: [settings.pluginDir, fromRoot('src/core_plugins')]
      },
      uiSettings: {
        enabled: false
      }
    }
  );

  const kbnServer = new KbnServer(serverConfig);
  await kbnServer.ready();
  await kbnServer.close();
}

export function assertVersion(plugin) {
  return new Promise((resolve, reject) => {
    if (!plugin.kibanaVersion) {
      reject(`Plugin package.json is missing both a version property (required) and a kibana.version property (optional).`);
    }

    const actual = cleanVersion(plugin.kibanaVersion);
    const expected = cleanVersion(plugin.version);

    if (!versionSatisfies(actual, expected)) {
      reject(`Incorrect Kibana version in plugin [${plugin.name}]. Expected [${expected}]; found [${actual}]`);
    }

    resolve();
  });
}
