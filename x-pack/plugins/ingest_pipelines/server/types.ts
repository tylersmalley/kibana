/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { IRouter } from 'src/core/server';
import { LicensingPluginSetup } from 'x-pack/plugins/licensing/server';
import { SecurityPluginSetup } from 'x-pack/plugins/security/server';
import { PluginSetupContract as FeaturesPluginSetup } from 'x-pack/plugins/features/server';
import { License } from './services';
import { isEsError } from './shared_imports';

export interface Dependencies {
  security: SecurityPluginSetup;
  features: FeaturesPluginSetup;
  licensing: LicensingPluginSetup;
}

export interface RouteDependencies {
  router: IRouter;
  license: License;
  config: {
    isSecurityEnabled: () => boolean;
  };
  lib: {
    isEsError: typeof isEsError;
  };
}
