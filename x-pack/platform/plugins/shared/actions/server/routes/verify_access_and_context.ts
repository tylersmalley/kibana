/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { RequestHandler } from '@kbn/core/server';
import type { ILicenseState } from '../lib';
import { isErrorThatHandlesItsOwnResponse, verifyApiAccess } from '../lib';
import type { ActionsRequestHandlerContext } from '../types';

type ActionsRequestHandlerWrapper = <
  P,
  Q,
  B,
  Context extends ActionsRequestHandlerContext,
  THandler extends RequestHandler<P, Q, B, Context>
>(
  licenseState: ILicenseState,
  handler: THandler
) => THandler;

export const verifyAccessAndContext: ActionsRequestHandlerWrapper = (licenseState, handler) => {
  return (async (...args: Parameters<typeof handler>) => {
    const [context, request, response] = args;
    verifyApiAccess(licenseState);

    if (!context.actions) {
      return response.badRequest({ body: 'RouteHandlerContext is not registered for actions' });
    }

    try {
      return await handler(context, request, response);
    } catch (e) {
      if (isErrorThatHandlesItsOwnResponse(e)) {
        return e.sendResponse(response);
      }
      throw e;
    }
  }) as typeof handler;
};
