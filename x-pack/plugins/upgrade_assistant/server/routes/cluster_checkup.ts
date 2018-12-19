/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import Boom from 'boom';
import { Legacy } from 'kibana';
import _ from 'lodash';

import { getUpgradeAssistantStatus } from '../lib/es_migration_apis';

export function registerClusterCheckupRoutes(server: Legacy.Server) {
  const { callWithRequest } = server.plugins.elasticsearch.getCluster('data');
  const basePath = server.config().get<string>('server.basePath');

  server.route({
    path: '/api/upgrade_assistant/status',
    method: 'GET',
    async handler(request) {
      const boundCallWithRequest = _.partial(callWithRequest, request);
      const { registrations: ecsAliaseRegistrations } = server.plugins.upgrade_assistant.aliases;

      try {
        return await getUpgradeAssistantStatus(
          boundCallWithRequest,
          basePath,
          ecsAliaseRegistrations
        );
      } catch (e) {
        if (e.status === 403) {
          return Boom.forbidden(e.message);
        }

        return Boom.boomify(e, {
          statusCode: 500,
        });
      }
    },
  });
}
