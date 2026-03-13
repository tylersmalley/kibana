/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { RequestHandler } from '@kbn/core/server';

import type { SecurityRequestHandlerContext } from '../types';

type LicensedRouteHandlerWrapper = <
  Context extends SecurityRequestHandlerContext,
  THandler extends RequestHandler<any, any, any, Context, any, any>
>(
  handler: THandler
) => THandler;

export const createLicensedRouteHandler: LicensedRouteHandlerWrapper = (handler) => {
  return (async (...args: Parameters<typeof handler>) => {
    const [context, request, responseToolkit] = args;
    const { license } = await context.licensing;
    const licenseCheck = license.check('security', 'basic');
    if (licenseCheck.state === 'unavailable' || licenseCheck.state === 'invalid') {
      return responseToolkit.forbidden({ body: { message: licenseCheck.message! } });
    }

    return handler(context, request, responseToolkit);
  }) as typeof handler;
};
