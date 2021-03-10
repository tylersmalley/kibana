/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { IRouter } from 'src/core/server';
import { LicensingPluginSetup } from 'x-pack/plugins/licensing/server';
import { License } from './services';

export interface RouteDependencies {
  router: IRouter;
  license: License;
}

export interface Dependencies {
  licensing: LicensingPluginSetup;
}
