import { rename } from 'fs';
import { delay } from 'lodash';
import path from 'path';

export function renamePlugin(plugin, tempPath, finalPath) {
  return new Promise(function (resolve, reject) {
    const start = Date.now();
    const retryTime = 3000;
    const retryDelay = 100;

    const pluginTempPath = path.join(tempPath, plugin.name);
    const pluginFinalPath = path.join(finalPath, plugin.name);

    rename(pluginTempPath, pluginFinalPath, function retry(err) {
      if (err) {
        // In certain cases on Windows, such as running AV, plugin folders can be locked shortly after extracting
        // Retry for up to retryTime seconds
        const windowsEPERM = process.platform === 'win32' && err.code === 'EPERM';
        const retryAvailable = Date.now() - start < retryTime;

        if (windowsEPERM && retryAvailable) {
          return delay(rename, retryDelay, pluginTempPath, pluginFinalPath, retry);
        }

        reject(`unable to move ${plugin.name}`);
      }

      resolve();
    });
  });
}
