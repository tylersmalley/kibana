import path from 'path';
import validatePackageName from 'validate-npm-package-name';
import { get, delay } from 'lodash';
import { stat, rename } from 'fs';

import { unzip } from '../install/zip';
import { versionSatisfies, cleanVersion } from '../../utils/version';

const TEMP_DIR = '.installing';
const TEMP_ARCHIVE = path.join(TEMP_DIR, 'archive.zip');

export default class Plugin {

  /**
   * @param {object} pkg - contents of the package.json
   */
  constructor(pkg) {
    this.pkg = pkg;
  }

  /**
   * @return {string} - name of the package contained in the package.json
   */

  name() {
    return get(this.pkg, 'name');
  }

  version() {
    return get(this.pkg, 'version');
  }

  kibanaVersion() {
    return get(this.pkg, 'kibana.version', this.version());
  }

  /**
   * Extracts the plugin from within _archive_ to __dirname
   *
   * @param {string} pluginDir - full path to plugin directory
   */

  extract(pluginDir) {
    return new Promise((resolve, reject) => {
      const archivePath = path.join(pluginDir, TEMP_ARCHIVE);

      if (!this.pathWithinArchive) {
        return reject(`pathWithinArchive must be set`);
      }

      return unzip(archivePath, path.join(pluginDir, TEMP_DIR, this.name()), `${this.pathWithinArchive}/(.*)`)
        .then(resolve)
        .catch(reject);
    });
  }

  /**
   * Checks the presense of the plugin within _dir_
   *
   * @param {string} dir - full path to check for the plugin in
   */

  exists(dir) {
    return new Promise(resolve => {
      stat(path.join(dir, this.name()), err => {
        if (err) {
          return resolve(false);
        }

        resolve(true);
      });
    });
  }

  checkVersion() {
    return new Promise((resolve, reject) => {
      if (!this.kibanaVersion()) {
        reject(`Plugin package.json is missing both a version property (required) and a kibana.version property (optional).`);
      }

      const actual = cleanVersion(this.kibanaVersion());
      const expected = cleanVersion(this.version());

      if (!versionSatisfies(actual, expected)) {
        reject(`Incorrect Kibana version in plugin [${this.name()}]. Expected [${expected}]; found [${actual}]`);
      }

      resolve();
    });
  }

  rename(pluginDir) {
    return new Promise((resolve, reject) => {
      const start = Date.now();
      const retryTime = 3000;
      const retryDelay = 100;

      const name = this.name();
      const pluginTempPath = path.join(pluginDir, TEMP_DIR, name);
      const pluginFinalPath = path.join(pluginDir, name);

      function retry(err) {
        if (err) {
          // In certain cases on Windows, such as running AV, plugin folders can be
          // locked shortly after extracting. Retry for up to retryTime seconds
          const windowsEPERM = process.platform === 'win32' && err.code === 'EPERM';
          const retryAvailable = Date.now() - start < retryTime;

          if (windowsEPERM && retryAvailable) {
            return delay(rename, retryDelay, pluginTempPath, pluginFinalPath, retry);
          }

          reject(err);
        }

        resolve();
      }

      rename(pluginTempPath, pluginFinalPath, retry);
    });
  }

  isValidName() {
    return validatePackageName(this.name());
  }
}
