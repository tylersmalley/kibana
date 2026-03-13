/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { Subject } from 'rxjs';
import type {
  RequestHandler,
  RouteConfig,
  RouteMethod,
  SavedObjectsClientContract,
  KibanaRequest,
  KibanaResponseFactory,
  IKibanaResponse,
  RouteSecurity,
} from '@kbn/core/server';
import type { HttpResponsePayload, ResponseError } from '@kbn/core-http-server';
import type { UMServerLibs, UptimeEsClient } from '../lib/lib';
import type { UptimeRequestHandlerContext } from '../../types';
import type { UptimeServerSetup } from '../lib/adapters';

export type SyntheticsRequest<
  Params = Record<string, any>,
  Query = Record<string, any>,
  Body = Record<string, any>
> = KibanaRequest<Params, Query, Body>;

/**
 * Defines the basic properties employed by Uptime routes.
 */
export interface UMServerRoute<T> {
  method: 'GET' | 'PUT' | 'POST' | 'DELETE';
  writeAccess?: boolean;
  handler: T;
  streamHandler?: (
    context: UptimeRequestHandlerContext,
    request: SyntheticsRequest,
    subject: Subject<unknown>
  ) => IKibanaResponse<any> | Promise<IKibanaResponse<any>>;
}

/**
 * Merges basic uptime route properties with the route config type
 * provided by Kibana core.
 */
export type UMRouteDefinition<
  T,
  Params = Record<string, any>,
  Query = Record<string, any>,
  Body = Record<string, any>
> = UMServerRoute<T> &
  Omit<RouteConfig<Params, Query, Body, RouteMethod>, 'security'> & {
    security?: RouteSecurity;
  };
/**
 * This type represents an Uptime route definition that corresponds to the contract
 * provided by the Kibana platform. Route objects must conform to this type in order
 * to successfully interact with the Kibana platform.
 */
export type UMKibanaRoute = UMRouteDefinition<
  RequestHandler<
    Record<string, any>,
    Record<string, any>,
    Record<string, any>,
    UptimeRequestHandlerContext
  >
>;

/**
 * This is an abstraction over the default Kibana route type. This allows us to use custom
 * arguments in our route handlers and impelement custom middleware.
 */
export type UptimeRoute<
  ClientContract extends HttpResponsePayload | ResponseError = any,
  Params = Record<string, any>,
  Query = Record<string, any>,
  Body = Record<string, any>
> = UMRouteDefinition<UMRouteHandler<ClientContract, Params, Query, Body>, Params, Query, Body>;

/**
 * Functions of this type accept custom lib functions and outputs a route object.
 */
export type UMRestApiRouteFactory<
  ClientContract extends HttpResponsePayload | ResponseError = any,
  Params = Record<string, any>,
  Query = Record<string, any>,
  Body = Record<string, any>
> = (libs: UMServerLibs) => UptimeRoute<ClientContract, Params, Query, Body>;

/**
 * Functions of this type accept our internal route format and output a route
 * object that the Kibana platform can consume.
 */
export type UMKibanaRouteWrapper = (
  uptimeRoute: UptimeRoute<any>,
  server: UptimeServerSetup
) => UMKibanaRoute & { security: RouteSecurity };

export interface UptimeRouteContext {
  uptimeEsClient: UptimeEsClient;
  context: UptimeRequestHandlerContext;
  request: SyntheticsRequest;
  response: KibanaResponseFactory;
  savedObjectsClient: SavedObjectsClientContract;
  server: UptimeServerSetup;
  subject?: Subject<unknown>;
}

/**
 * This is the contract we specify internally for route handling.
 */
export type UMRouteHandler<
  ClientContract extends HttpResponsePayload | ResponseError = any,
  Params = Record<string, any>,
  Query = Record<string, any>,
  Body = Record<string, any>
> = ({
  uptimeEsClient,
  context,
  request,
  response,
  server,
  savedObjectsClient,
  subject,
}: Omit<UptimeRouteContext, 'request'> & {
  request: KibanaRequest<Params, Query, Body>;
}) => Promise<IKibanaResponse<ClientContract> | ClientContract>;

export interface RouteContext<Query = Record<string, any>> {
  uptimeEsClient: UptimeEsClient;
  context: UptimeRequestHandlerContext;
  request: KibanaRequest<Record<string, any>, Query, Record<string, any>>;
  response: KibanaResponseFactory;
  savedObjectsClient: SavedObjectsClientContract;
  server: UptimeServerSetup;
  subject?: Subject<unknown>;
  spaceId: string;
}
