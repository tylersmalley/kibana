/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import Boom from 'boom';
import { Server } from 'hapi';
import Joi from 'joi';
import _ from 'lodash';

import { EcsAliases } from '../lib/ecs_aliases';

export function registerEcsAliasRoutes(server: Server) {
  const { callWithRequest } = server.plugins.elasticsearch.getCluster('data');

  server.route({
    path: '/api/upgrade_assistant/ecs_aliases',
    method: 'GET',
    options: {
      validate: {
        query: Joi.object()
          .keys({
            limit: Joi.number().default(20),
            offset: Joi.number().default(0),
            batch_size: Joi.number(),
          })
          .required(),
      },
    },
    async handler(request) {
      const boundCallWithRequest = _.partial(callWithRequest, request);
      const { batch_size: batchSize, limit, offset } = request.query;
      const { registrations } = server.plugins.upgrade_assistant.aliases;

      const aliases = new EcsAliases(boundCallWithRequest, registrations, batchSize);

      try {
        return await aliases.fetch(offset, limit);
      } catch (e) {
        return Boom.boomify(e, {
          statusCode: 500,
        });
      }
    },
  });

  server.route({
    path: '/api/upgrade_assistant/ecs_aliases/{indices}',
    method: 'PUT',
    options: {
      validate: {
        params: Joi.object()
          .keys({
            indices: Joi.string().required(),
          })
          .required(),
      },
    },
    async handler(request) {
      const boundCallWithRequest = _.partial(callWithRequest, request);
      const { registrations } = server.plugins.upgrade_assistant.aliases;

      const aliases = new EcsAliases(boundCallWithRequest, registrations);

      try {
        const resp = await aliases.create(request.params.indices.split(','));
        return resp;
      } catch (e) {
        return Boom.boomify(e, {
          statusCode: 500,
        });
      }
    },
  });
}
