import yauzl from 'yauzl';
import fs from 'fs';
import path from 'path';
import mkdirp from 'mkdirp';

/**
 * Extracts files from a zip archive to a file path using a filter function
 * @param {string} archive - file path to a zip archive
 * @param {string} targetDir - directory path to where the files should
 *  extracted
 */
export function unzip(archive, targetDir, filter) {
  return new Promise((resolve, reject) => {
    yauzl.open(archive, { lazyEntries: true }, function (err, zipfile) {
      if (err) {
        reject(err);
      }

      zipfile.readEntry();
      zipfile.on('close', resolve);
      zipfile.on('entry', function (entry) {
        let fileName = entry.fileName;

        if (filter) {
          const match = fileName.match(filter);

          if (match) {
            fileName = match[1];
          } else {
            return zipfile.readEntry();
          }
        }

        if (targetDir) {
          fileName = path.join(targetDir, fileName);
        }

        if (/\/$/.test(entry.fileName)) {
          // directory file names end with '/'
          mkdirp(entry.fileName, function (err) {
            if (err) {
              reject(err);
            }

            zipfile.readEntry();
          });
        } else {
          // file entry
          zipfile.openReadStream(entry, function (err, readStream) {
            if (err) {
              reject(err);
            }

            // ensure parent directory exists
            mkdirp(path.dirname(fileName), function (err) {
              if (err) {
                reject(err);
              }

              readStream.pipe(fs.createWriteStream(fileName));
              readStream.on('end', function () {
                zipfile.readEntry();
              });
            });
          });
        }
      });
    });
  });
}
