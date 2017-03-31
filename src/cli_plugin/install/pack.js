import { get } from 'lodash';
import yauzl from 'yauzl';
import { unzip } from './zip';
import path from 'path';
import validatePackageName from 'validate-npm-package-name';

/**
 * Returns an array of package objects. There will be one for each of
 *  package.json files in the archive
 *
 * @param {string} zipFile - path to zip file
 */
function readPackages(zipFile) {
  const plugins = [];
  const regExp = new RegExp('(kibana/([^/]+))/package.json', 'i');

  return new Promise ((resolve, reject) => {
    yauzl.open(zipFile, { lazyEntries: true }, function (err, zipfile) {
      if (err) {
        reject(err);
      }

      zipfile.readEntry();
      zipfile.on('entry', function (entry) {
        const match = entry.fileName.match(regExp);

        if (match) {
          zipfile.openReadStream(entry, function (err, readable) {
            const chunks = [];

            if (err) {
              reject(`unable to read ${entry.fileName} within zip`);
            }

            readable.on('data', chunk => chunks.push(chunk));

            readable.on('end', function () {
              const contents = Buffer.concat(chunks).toString();
              const plugin = parsePluginPackage(JSON.parse(contents));

              plugins.push(Object.assign(plugin, { path: match[1], zipFile }));
              zipfile.readEntry();
            });
          });
        } else {
          zipfile.readEntry();
        }
      });

      zipfile.on('close', () => {
        resolve(plugins);
      });
    });
  });
}

function parsePluginPackage(data) {
  const version = get(data, 'version');

  return {
    version,
    name: get(data, 'name'),
    kibanaVersion: get(data, 'kibana.version', version)
  };
}

/**
 * Checks the plugin name. Will throw an exception if it does not meet
 *  npm package naming conventions
 *
 * @param {object} plugin
 */
function assertValidPackageName(plugin) {
  const validation = validatePackageName(plugin.name);

  if (!validation.validForNewPackages) {
    throw new Error(`Invalid plugin name [${plugin.name}] in package.json`);
  }
}

/**
 * Returns the detailed information about each kibana plugin in the pack.
 *  TODO: If there are platform specific folders, determine which one to use.
 * @param {object} settings - a plugin installer settings object
 * @param {object} logger - a plugin installer logger object
 */
export async function getPackData(tempArchiveFile, logger) {
  let packages;

  try {
    logger.log('Retrieving metadata from plugin archive');
    packages = await readPackages(tempArchiveFile);
  } catch (err) {
    logger.error(err);
    throw new Error('Error retrieving metadata from plugin archive');
  }

  if (packages.length === 0) {
    throw new Error('No kibana plugins found in archive');
  }

  packages.forEach(assertValidPackageName);

  return packages;
}

export async function extract(plugin, targetDir, logger) {
  logger.log(`Extracting ${plugin.name} archive`);

  return unzip(plugin.zipFile, path.join(targetDir, plugin.name), `${plugin.path}/(.*)`).then(() => {
    logger.log(`Extraction of ${plugin.name} complete`);
  });
}
