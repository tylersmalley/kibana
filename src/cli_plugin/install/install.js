import { download } from './download';
import Promise from 'bluebird';
import { cleanPrevious, cleanArtifacts } from './cleanup';
import { extract, getPackData } from './pack';
import { renamePlugin } from './rename';
import { sync as rimrafSync } from 'rimraf';
import { existingInstall, rebuildCache, assertVersion } from './kibana';
import mkdirp from 'mkdirp';

const mkdir = Promise.promisify(mkdirp);

export default async function install(settings, logger) {
  try {
    // remove any pre-existing plugins/.installing directory
    await cleanPrevious(settings, logger);

    // creates plugins/.installing directory
    await mkdir(settings.workingPath);

    // downloads/copy zip to temporary location
    await download(settings, logger);

    // extracts plugin meta data from  package.json files within the zip
    const plugins = await getPackData(settings.tempArchiveFile, logger);

    // extracts plugins into plugins/.installing directory
    await Promise.all(plugins.map(plugin => {
      return extract(plugin, settings.workingPath, logger);
    }));

    // deletes temporary zip file
    rimrafSync(settings.tempArchiveFile);

    // preform plugin checks
    await Promise.all(plugins.map(plugin => {
      return Promise.all([
        // fail if plugin is already installed
        existingInstall(settings.pluginDir, plugin, logger),

        // fail if plugin version does not match Kibana's
        assertVersion(plugin)
      ]);
    })).catch(reason => {
      throw new Error(reason);
    });

    await Promise.all(plugins.map(plugin => {
      return renamePlugin(plugin, settings.workingPath, settings.pluginDir);
    })).catch(reason => {
      throw new Error(reason);
    });

    // runs optimize
    await rebuildCache(settings, logger);

    logger.log('Plugin installation complete');
  } catch (err) {
    logger.error(`Plugin installation was unsuccessful due to error "${err.message}"`);
    cleanArtifacts(settings);
    process.exit(70); // eslint-disable-line no-process-exit
  }
}
