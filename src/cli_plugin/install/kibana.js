import { merge } from 'lodash';
import { fromRoot } from '../../utils';
import KbnServer from '../../server/kbn_server';
import readYamlConfig from '../../cli/serve/read_yaml_config';

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
