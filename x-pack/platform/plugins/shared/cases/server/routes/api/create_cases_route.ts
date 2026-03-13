/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { RouteValidationSpec, RouteValidatorConfig } from '@kbn/core/server';
import type { AnyCaseRoute, CaseRoute } from './types';

type InferValidatedValue<TSpec> = TSpec extends RouteValidationSpec<infer TValue>
  ? TValue
  : unknown;

type InferCaseRoutePart<
  TParams,
  TPart extends keyof RouteValidatorConfig<unknown, unknown, unknown>
> = TParams extends { [K in TPart]?: infer TSpec }
  ? InferValidatedValue<NonNullable<TSpec>>
  : unknown;

export function createCasesRoute<
  TParams extends RouteValidatorConfig<unknown, unknown, unknown>,
  P = InferCaseRoutePart<TParams, 'params'>,
  Q = InferCaseRoutePart<TParams, 'query'>,
  B = InferCaseRoutePart<TParams, 'body'>
>(route: Omit<CaseRoute<P, Q, B>, 'params'> & { params: TParams }): CaseRoute<P, Q, B>;
export function createCasesRoute<P, Q, B>(route: CaseRoute<P, Q, B>): CaseRoute<P, Q, B>;
export function createCasesRoute(route: AnyCaseRoute) {
  return route;
}
