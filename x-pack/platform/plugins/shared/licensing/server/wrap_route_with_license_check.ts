/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type {
  RequestHandler,
  KibanaRequest,
  RouteMethod,
  KibanaResponseFactory,
} from '@kbn/core/server';

import type { ILicense } from '@kbn/licensing-types';
import type { LicensingRequestHandlerContext } from './types';

export type CheckLicense = (
  license: ILicense
) => { valid: false; message: string } | { valid: true; message: null };

export function wrapRouteWithLicenseCheck<
  Context extends LicensingRequestHandlerContext,
  THandler extends RequestHandler<any, any, any, Context>
>(checkLicense: CheckLicense, handler: THandler): THandler {
  return (async (...args: Parameters<THandler>) => {
    const [context, request, response] = args as [
      Context,
      KibanaRequest<any, any, any, RouteMethod>,
      KibanaResponseFactory
    ];
    const { license } = await context.licensing;
    const licenseCheckResult = checkLicense(license);

    if (licenseCheckResult.valid) {
      return handler(context, request, response);
    } else {
      return response.forbidden({
        body: licenseCheckResult.message,
      });
    }
  }) as THandler;
}
