import yauzl from 'yauzl';
import path from 'path';
import rimraf from 'rimraf';
import fs from 'fs';
import mkdirp from 'mkdirp';
import Plugin from '../lib/plugin';

const TEMP_DIR = '.installing';
const TEMP_ARCHIVE = path.join(TEMP_DIR, 'archive.zip');

export class Pack {
  constructor(settings) {
    this.pluginDir = settings.pluginDir;
  }

  tempDir() {
    return path.join(this.pluginDir, TEMP_DIR);
  }

  tempArchive() {
    return path.join(this.pluginDir, TEMP_ARCHIVE);
  }

  /**
   * Returns an array of package objects. There will be one for each of
   *  package.json files in the archive
   *
   * @param {string} pluginArchive - path to plugin archive zip file
   */

  analyzeArchive(pluginArchive) {
    const plugins = [];
    const regExp = new RegExp('(kibana/([^/]+))/package.json', 'i');

    return new Promise ((resolve, reject) => {
      yauzl.open(pluginArchive, { lazyEntries: true }, function (err, zipfile) {
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
                const pkg = Buffer.concat(chunks).toString();
                const plugin = new Plugin(JSON.parse(pkg));

                plugin.pathWithinArchive = match[1];

                plugins.push(plugin);
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

  clean() {
    return new Promise((resolve, reject) => {
      rimraf(this.tempDir(), err => {
        if (err) {
          return reject(err);
        }

        resolve();
      });
    });
  }

  hasTempDir() {
    return new Promise(resolve => {
      fs.stat(this.tempDir(), err => {
        if (err) {
          return resolve(false);
        }

        resolve(true);
      });
    });
  }

  mkdir() {
    return new Promise((resolve, reject) => {
      mkdirp(this.tempDir(), (err, made) => {
        if (err) {
          return reject(err);
        }

        resolve(made);
      });
    });
  }
}
