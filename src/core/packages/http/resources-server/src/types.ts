/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import type {
  RouteConfig,
  IKibanaResponse,
  ResponseHeaders,
  HttpResponseOptions,
  KibanaResponseFactory,
  RequestHandler,
  RouteValidationSpec,
  RouteValidatorFullConfigRequest,
} from '@kbn/core-http-server';
import type { RequestHandlerContext } from '@kbn/core-http-request-handler-context-server';

type InferValidatedValue<TSpec> = TSpec extends RouteValidationSpec<infer TValue>
  ? TValue
  : unknown;

type IsUnknown<T> = unknown extends T ? ([T] extends [unknown] ? true : false) : false;

type InferRouteValidatedPart<
  TValidate,
  TPart extends keyof RouteValidatorFullConfigRequest<any, any, any>
> = TValidate extends false
  ? unknown
  : TValidate extends () => infer TResolvedValidate
  ? InferRouteValidatedPart<TResolvedValidate, TPart>
  : TValidate extends { request: infer TRequest }
  ? InferRouteValidatedPart<TRequest, TPart>
  : TValidate extends { [K in TPart]?: infer TSpec }
  ? InferValidatedValue<NonNullable<TSpec>>
  : unknown;

type InferRouteConfigPart<
  TRoute extends RouteConfig<any, any, any, 'get'>,
  TPart extends keyof RouteValidatorFullConfigRequest<any, any, any>
> = TPart extends 'params'
  ? TRoute extends RouteConfig<infer P, any, any, 'get'>
    ? P
    : unknown
  : TPart extends 'query'
  ? TRoute extends RouteConfig<any, infer Q, any, 'get'>
    ? Q
    : unknown
  : TPart extends 'body'
  ? TRoute extends RouteConfig<any, any, infer B, 'get'>
    ? B
    : unknown
  : unknown;

type InferRouteRequestPart<
  TRoute extends RouteConfig<any, any, any, 'get'>,
  TPart extends keyof RouteValidatorFullConfigRequest<any, any, any>
> = IsUnknown<InferRouteValidatedPart<TRoute['validate'], TPart>> extends true
  ? InferRouteConfigPart<TRoute, TPart>
  : InferRouteValidatedPart<TRoute['validate'], TPart>;

/**
 * Allows to configure HTTP response parameters
 * @public
 */
export interface HttpResourcesRenderOptions {
  /**
   * HTTP Headers with additional information about response.
   * @remarks
   * All HTML pages are already pre-configured with `content-security-policy` header that cannot be overridden.
   * */
  headers?: ResponseHeaders;
  /**
   * @internal
   * This is only used for integration tests that allow us to verify which config keys are exposed to the browser.
   */
  includeExposedConfigKeys?: boolean;
}

/**
 * HTTP Resources response parameters
 * @public
 */
export type HttpResourcesResponseOptions = HttpResponseOptions;

/**
 * Extended set of {@link KibanaResponseFactory} helpers used to respond with HTML or JS resource.
 * @public
 */
export interface HttpResourcesServiceToolkit {
  /** To respond with HTML page bootstrapping Kibana application. */
  renderCoreApp: (options?: HttpResourcesRenderOptions) => Promise<IKibanaResponse>;
  /**
   * To respond with HTML page bootstrapping Kibana application without retrieving user-specific information.
   * **Note:**
   * - Your client-side JavaScript bundle will only be loaded on an anonymous page if `plugin.enabledOnAnonymousPages` is enabled in your plugin's `kibana.jsonc` manifest file.
   * - You will also need to register the route serving your anonymous app with the `coreSetup.http.anonymousPaths` service in your plugin's client-side `setup` method.
   * */
  renderAnonymousCoreApp: (options?: HttpResourcesRenderOptions) => Promise<IKibanaResponse>;
  /** To respond with a custom HTML page. */
  renderHtml: (options: HttpResourcesResponseOptions) => IKibanaResponse;
  /** To respond with a custom JS script file. */
  renderJs: (options: HttpResourcesResponseOptions) => IKibanaResponse;
  /** To respond with a custom CSS script file. */
  renderCss: (options: HttpResourcesResponseOptions) => IKibanaResponse;
}

/**
 * Extended version of {@link RequestHandler} having access to {@link HttpResourcesServiceToolkit}
 * to respond with HTML or JS resources.
 * @param context {@link RequestHandlerContext} - the core context exposed for this request.
 * @param request {@link KibanaRequest} - object containing information about requested resource,
 * such as path, method, headers, parameters, query, body, etc.
 * @param response {@link KibanaResponseFactory} {@libk HttpResourcesServiceToolkit} - a set of helper functions used to respond to a request.
 *
 *  @example
 * ```typescript
 * httpResources.register({
 *   path: '/login',
 *   validate: {
 *     params: schema.object({ id: schema.string() }),
 *   },
 * },
 * async (context, request, response) => {
 *   //..
 *   return response.renderCoreApp();
 * });
 * @public
 */
export type HttpResourcesRequestHandler<
  P = unknown,
  Q = unknown,
  B = unknown,
  Context extends RequestHandlerContext = RequestHandlerContext
> = RequestHandler<P, Q, B, Context, 'get', KibanaResponseFactory & HttpResourcesServiceToolkit>;

/**
 * HttpResources service is responsible for serving static & dynamic assets for Kibana application via HTTP.
 * Provides API allowing plug-ins to respond with:
 * - a pre-configured HTML page bootstrapping Kibana client app
 * - custom HTML page
 * - custom JS script file.
 * @public
 */
export interface HttpResources {
  /** To register a route handler executing passed function to form response. */
  register: <
    TRoute extends RouteConfig<any, any, any, 'get'>,
    P = InferRouteRequestPart<TRoute, 'params'>,
    Q = InferRouteRequestPart<TRoute, 'query'>,
    B = InferRouteRequestPart<TRoute, 'body'>,
    Context extends RequestHandlerContext = RequestHandlerContext
  >(
    route: TRoute,
    handler: HttpResourcesRequestHandler<P, Q, B, Context>
  ) => void;
}
