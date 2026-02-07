/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

//eslint-disable-next-line import/no-extraneous-dependencies
const execa = require('execa');
const { resolve } = require('path');
//eslint-disable-next-line import/no-extraneous-dependencies
const { argv } = require('yargs');
const REPO_ROOT = resolve(__dirname, '..', '..', '..', '..', '..', '..');

async function run() {
  const fix = !!argv.fix;
  const args = ['scripts/lint', ...(fix ? ['--fix'] : []), resolve(__dirname, '..')];
  await execa('node', args, {
    cwd: REPO_ROOT,
    stdio: 'inherit',
  });
}

run()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
