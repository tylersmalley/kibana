/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { IRouter, ILegacyScopedClusterClient, RequestHandlerContext } from 'src/core/server';
import { PluginSetupContract as FeaturesPluginSetup } from 'x-pack/plugins/features/server';
import { LicensingPluginSetup } from 'x-pack/plugins/licensing/server';
import { IndexManagementPluginSetup } from 'x-pack/plugins/index_management/server';
import { RemoteClustersPluginSetup } from 'x-pack/plugins/remote_clusters/server';
import { License } from './services';
import { isEsError } from './shared_imports';
import { formatEsError } from './lib/format_es_error';

export interface Dependencies {
  licensing: LicensingPluginSetup;
  indexManagement: IndexManagementPluginSetup;
  remoteClusters: RemoteClustersPluginSetup;
  features: FeaturesPluginSetup;
}

export interface RouteDependencies {
  router: CcrPluginRouter;
  license: License;
  lib: {
    isEsError: typeof isEsError;
    formatEsError: typeof formatEsError;
  };
}

/**
 * @internal
 */
export interface CcrRequestHandlerContext extends RequestHandlerContext {
  crossClusterReplication: {
    client: ILegacyScopedClusterClient;
  };
}

/**
 * @internal
 */
type CcrPluginRouter = IRouter<CcrRequestHandlerContext>;
