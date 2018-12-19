/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import _ from 'lodash';

import { Request } from 'hapi';
import { alias } from 'io-ts';
import { DeprecationAPIResponse, DeprecationInfo } from 'src/legacy/core_plugins/elasticsearch';

import { EcsAliases } from './ecs_aliases';

export interface EnrichedDeprecationInfo extends DeprecationInfo {
  index?: string;
  node?: string;
  actions?: Array<{
    label: string;
    url: string;
  }>;
}

export interface UpgradeAssistantStatus {
  cluster: EnrichedDeprecationInfo[];
  indices: EnrichedDeprecationInfo[];
  ecs_aliases: any;
  [checkupType: string]: EnrichedDeprecationInfo[];
}

export async function getUpgradeAssistantStatus(
  boundCallWithRequest: any,
  basePath: string,
  ecsAliaseRegistrations: any
): Promise<UpgradeAssistantStatus> {
  const ecsAliases = new EcsAliases(boundCallWithRequest, ecsAliaseRegistrations);

  // ) as DeprecationAPIResponse?
  const [deprecations, aliases] = await Promise.all([
    boundCallWithRequest('transport.request', {
      path: '/_xpack/migration/deprecations',
      method: 'GET',
    }),
    ecsAliases.fetch(),
  ]);

  return {
    cluster: deprecations.cluster_settings.concat(deprecations.node_settings),
    indices: getCombinedIndexInfos(deprecations, basePath),
    ecs_aliases: aliases,
  };
}

// Combines the information from the migration assistance api and the deprecation api into a single array.
// Enhances with information about which index the deprecation applies to and adds buttons for accessing the
// reindex UI.
const getCombinedIndexInfos = (deprecations: DeprecationAPIResponse, basePath: string) =>
  Object.keys(deprecations.index_settings).reduce(
    (indexDeprecations, indexName) => {
      return indexDeprecations.concat(
        deprecations.index_settings[indexName].map(
          d => ({ ...d, index: indexName } as EnrichedDeprecationInfo)
        )
      );
    },
    [] as EnrichedDeprecationInfo[]
  );
