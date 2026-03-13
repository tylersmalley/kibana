/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { CustomRequestHandlerContext, RequestHandler } from '@kbn/core/server';
import type { LicensingApiRequestHandlerContext } from '@kbn/licensing-plugin/server';

export const createLicensedRouteHandler = <
  Context extends CustomRequestHandlerContext<{ licensing: LicensingApiRequestHandlerContext }>,
  THandler extends RequestHandler<any, any, any, Context, any, any>
>(
  handler: THandler
): THandler => {
  return (async (...args: Parameters<THandler>) => {
    const [context, request, responseToolkit] = args;
    const { license } = await context.licensing;
    const licenseCheck = license.check('spaces', 'basic');
    if (licenseCheck.state === 'unavailable' || licenseCheck.state === 'invalid') {
      return responseToolkit.forbidden({ body: { message: licenseCheck.message! } });
    }

    return handler(context, request, responseToolkit);
  }) as THandler;
};
