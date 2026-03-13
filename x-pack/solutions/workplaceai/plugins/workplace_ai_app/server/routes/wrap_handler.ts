/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { Logger, RequestHandler } from '@kbn/core/server';
import { isWorkplaceAIError } from '../errors';

export const getHandlerWrapper =
  ({ logger }: { logger: Logger }) =>
  <THandler extends RequestHandler<any, any, any>>(handler: THandler): THandler => {
    return ((...args: Parameters<THandler>) => {
      const [ctx, req, res] = args;
      try {
        return handler(ctx, req, res);
      } catch (e) {
        logger.error(e);
        if (isWorkplaceAIError(e)) {
          return res.customError({
            body: { message: e.message },
            statusCode: e.statusCode,
          });
        } else {
          throw e;
        }
      }
    }) as THandler;
  };
