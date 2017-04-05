import { download } from './download';
import { Pack } from './pack';
import { rebuildCache } from './kibana';

export default async function install(settings, logger) {
  const pack = new Pack(settings);

  try {

    if (await pack.hasTempDir()) {
      logger.log('Found previous install attempt. Deleting...');
      await pack.clean();
    }

    // creates plugins/.installing directory
    await pack.mkdir();

    // downloads/copy zip to temporary location
    await download(settings, logger);

    // extracts plugin meta data from  package.json files within the zip
    logger.log('Retrieving metadata from plugin archive');
    const plugins = await pack.analyzeArchive(settings.tempArchiveFile);

    // extracts plugins into plugins/.installing directory
    await Promise.all(plugins.map(plugin => {
      logger.log(`Extracting ${plugin.name()} archive`);

      return plugin.extract(settings.pluginDir)
        .then(() => {
          logger.log(`Extraction of ${plugin.name()} complete`);
        })
        .catch((err) => {
          logger.error(err);
          throw new Error(`Extraction of ${plugin.name()} failed!`);
        });
    }));

    // // preform plugin checks
    await Promise.all(plugins.map(plugin => {
      return Promise.all([
        // fail if the plugin name is invalid according to package.json
        plugin.isValidName(),

        // fail if plugin is already installed
        plugin.checkVersion(),

        // fail if plugin version does not match Kibana's
        plugin.checkVersion()
      ]);
    })).catch(reason => {
      throw new Error(reason);
    });

    await Promise.all(plugins.map(plugin => {
      return plugin.rename(settings.pluginDir);
    })).catch(err => {
      console.log('fail', err);
      throw new Error(err);
    });

    // runs optimize
    await rebuildCache(settings, logger);

    await pack.clean();

    logger.log('Plugin installation complete');

  } catch (err) {
    logger.error(`Plugin installation was unsuccessful due to error "${err.message}"`);
    pack.clean();

    process.exit(70); // eslint-disable-line no-process-exit
  }
}
