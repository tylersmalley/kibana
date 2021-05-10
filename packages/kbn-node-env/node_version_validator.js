/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

const pkg = require('../../package.json');

// Note: This is written in ES5 so we can run this before anything else
// and gives support for older NodeJS versions
const currentVersion = (process && process.version) || null;
const rawRequiredVersion = (pkg && pkg.engines && pkg.engines.node) || null;
const requiredVersion = rawRequiredVersion ? 'v' + rawRequiredVersion : rawRequiredVersion;
const isVersionValid = !!currentVersion && !!requiredVersion && currentVersion === requiredVersion;

// Validates current the NodeJS version compatibility when Kibana starts.
if (!isVersionValid) {
  const errorMessage =
    'Kibana does not support the current Node.js version ' +
    currentVersion +
    '. Please use Node.js ' +
    requiredVersion +
    '.';

  // Actions to apply when validation fails: error report + exit.
  console.error(errorMessage);
  process.exit(1);
}
