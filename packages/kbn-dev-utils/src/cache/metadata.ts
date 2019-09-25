import fs from 'fs';
import crypto from 'crypto';
import path from 'path';
import mkdirp from 'mkdirp';

import simpleGit from 'simple-git/promise';
import chalk from 'chalk';


import { defaultLog } from '../tooling_log';

export async function sourceMetaData(sourcePath: string, log = defaultLog) {
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`${sourcePath} does not exist`);
  }

  const git = simpleGit(sourcePath);
  const status = await git.status();
  const branch = status.current;
  const sha = (await git.revparse(['HEAD'])).trim();

  log.info('on %s at %s', chalk.bold(branch), chalk.bold(sha));
  log.info('%s locally modified file(s)', chalk.bold(status.modified.length.toString()));

  const etag = crypto.createHash('md5').update(branch);
  etag.update(sha);

  // for changed files, use last modified times in hash calculation
  status.files.forEach(file => {
    etag.update(fs.statSync(path.join(sourcePath, file.path)).mtime.toString());
  });

  const sourcePathHash = crypto
    .createHash('md5')
    .update(sourcePath)
    .digest('hex');

  const cacheKey = `${sourcePathHash}-${branch}`

  return {
    etag: etag.digest('hex'),
    sourcePath,
    branch,
    cacheKey,
  };
}

export function readMetaData(file: string) {
  try {
    const meta = fs.readFileSync(`${file}.meta`, {
      encoding: 'utf8',
    });

    return {
      exists: fs.existsSync(file),
      ...JSON.parse(meta),
    };
  } catch (e) {
    if (e.code !== 'ENOENT') {
      throw e;
    }

    return {
      exists: false,
    };
  }
}

export function writeMetaData(file: string, details = {}) {
  const meta = {
    ts: new Date(),
    ...details,
  };

  mkdirp.sync(path.dirname(file));
  fs.writeFileSync(`${file}.meta`, JSON.stringify(meta, null, 2));
}