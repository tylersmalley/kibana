/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { IRouter } from 'kibana/server';
import { PluginSetupContract as FeaturesPluginSetup } from 'x-pack/plugins/features/server';
import { LicensingPluginSetup } from 'x-pack/plugins/licensing/server';
import { CloudSetup } from 'x-pack/plugins/cloud/server';

export interface Dependencies {
  licensing: LicensingPluginSetup;
  cloud: CloudSetup;
  features: FeaturesPluginSetup;
}

export interface RouteDependencies {
  router: IRouter;
  getLicenseStatus: () => LicenseStatus;
  config: {
    isCloudEnabled: boolean;
  };
}

export interface LicenseStatus {
  valid: boolean;
  message?: string;
}
