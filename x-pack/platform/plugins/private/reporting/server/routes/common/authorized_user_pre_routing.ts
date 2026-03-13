/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import Boom from '@hapi/boom';
import type { RequestHandler, RouteMethod } from '@kbn/core/server';

import type { ReportingCore } from '../../core';
import type { ReportingUser, ReportingRequestHandlerContext } from '../../types';
import { getAuthorizedUser } from './get_authorized_user';

type ReportingRequestHandler = RequestHandler<
  any,
  any,
  any,
  ReportingRequestHandlerContext,
  RouteMethod
>;

type RequestHandlerUser<THandler extends ReportingRequestHandler> = (
  user: ReportingUser,
  ...args: Parameters<THandler>
) => ReturnType<THandler>;

export function authorizedUserPreRouting<THandler extends ReportingRequestHandler>(
  reporting: ReportingCore,
  handler: RequestHandlerUser<THandler>
): THandler {
  const { logger } = reporting.getPluginSetupDeps();

  return (async (...args: Parameters<THandler>) => {
    const [, req, res] = args;

    try {
      const user = await getAuthorizedUser(reporting, req);

      return handler(user, ...args);
    } catch (err) {
      logger.error(err);
      if (err instanceof Boom.Boom) {
        return res.custom({
          statusCode: err.output.statusCode,
          body: err.output.payload.message,
        });
      }
      return res.custom({ statusCode: 500 });
    }
  }) as unknown as THandler;
}
