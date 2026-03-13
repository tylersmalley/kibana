/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { HttpResponsePayload, ResponseError } from '@kbn/core-http-server';
import type { UMServerLibs } from '../lib/lib';
import type { UptimeRoute, UMRestApiRouteFactory, UMRouteHandler } from './types';

export const createRouteWithAuth = <
  ClientContract extends HttpResponsePayload | ResponseError = any,
  Params = Record<string, any>,
  Query = Record<string, any>,
  Body = Record<string, any>
>(
  libs: UMServerLibs,
  routeCreator: UMRestApiRouteFactory<ClientContract, Params, Query, Body>
): UptimeRoute<ClientContract, Params, Query, Body> => {
  const restRoute = routeCreator(libs);
  const { handler, method, path, options, ...rest } = restRoute;
  const licenseCheckHandler: UMRouteHandler<ClientContract, Params, Query, Body> = async ({
    uptimeEsClient,
    context,
    request,
    response,
    savedObjectsClient,
    server,
  }) => {
    const { statusCode, message } = libs.license((await context.licensing).license);
    if (statusCode === 200) {
      return handler({
        uptimeEsClient,
        context,
        request,
        response,
        savedObjectsClient,
        server,
      });
    }
    switch (statusCode) {
      case 400:
        return response.badRequest({ body: { message } });
      case 401:
        return response.unauthorized({ body: { message } });
      case 403:
        return response.forbidden({ body: { message } });
      default:
        throw new Error('Failed to validate the license');
    }
  };

  return {
    method,
    path,
    options,
    handler: licenseCheckHandler,
    ...rest,
  };
};
