/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import type { DotObject } from '@kbn/utility-types';
import type { StepPropertyHandler } from '@kbn/workflows';
import type { z } from '@kbn/zod/v4';
import type { CommonStepDefinition } from '../../common';

type IsUnknown<T> = unknown extends T ? ([T] extends [unknown] ? true : false) : false;

type EditorHandlerValues<TValue extends Record<string, unknown>> = DotObject<TValue>;

type EditorHandlersObjectMap<TValue extends Record<string, unknown>> = Partial<{
  [K in keyof EditorHandlerValues<TValue>]: StepPropertyHandler<EditorHandlerValues<TValue>[K]>;
}>;

type EditorHandlersMap<TValue> = IsUnknown<TValue> extends true
  ? Record<string, StepPropertyHandler<unknown>>
  : [TValue] extends [Record<string, unknown>]
  ? EditorHandlersObjectMap<Extract<TValue, Record<string, unknown>>>
  : Record<string, never>;

/**
 * Helper function to create a PublicStepDefinition with automatic type inference.
 * This ensures that the editorHandlers' types are correctly inferred
 * from the inputSchema and configSchema without needing explicit type annotations.
 *
 **/
export function createPublicStepDefinition<
  Input extends z.ZodType = z.ZodType,
  Output extends z.ZodType = z.ZodType,
  Config extends z.ZodObject = z.ZodObject
>(
  definition: PublicStepDefinition<Input, Output, Config>
): PublicStepDefinition<Input, Output, Config> {
  return definition;
}

/**
 * User-facing metadata for a workflow step.
 * This is used by the UI to display step information (label, description, icon, schemas, documentation).
 */
export interface PublicStepDefinition<
  Input extends z.ZodType = z.ZodType,
  Output extends z.ZodType = z.ZodType,
  Config extends z.ZodObject = z.ZodObject
> extends CommonStepDefinition<Input, Output, Config> {
  /**
   * Icon type from EUI icon library.
   * Used to visually represent this step type in the UI.
   * kibana icon will be used if not provided
   * TODO: add support for EuiIconType
   */
  icon?: React.ComponentType;

  /**
   * Property handlers for the step.
   */
  editorHandlers?: EditorHandlers<Input, Output, Config>;
}

/**
 * Editor handlers type that maintains type safety while allowing variance
 */
export interface EditorHandlers<
  Input extends z.ZodType = z.ZodType,
  Output extends z.ZodType = z.ZodType,
  Config extends z.ZodObject = z.ZodObject
> {
  config?: EditorHandlersConfig<Config>;
  input?: EditorHandlersInput<Input>;
  dynamicSchema?: DynamicSchema<Input, Output, Config>;
}

export type EditorHandlersConfig<Config extends z.ZodObject = z.ZodObject> = EditorHandlersMap<
  z.output<Config>
>;

export type EditorHandlersInput<Input extends z.ZodType = z.ZodType> = Input extends z.ZodObject
  ? EditorHandlersMap<z.output<Input>>
  : Record<string, never>;

/**
 * Dynamic schema handlers for a step
 */
export interface DynamicSchema<
  Input extends z.ZodType = z.ZodType,
  Output extends z.ZodType = z.ZodType,
  Config extends z.ZodObject = z.ZodObject
> {
  /**
   * Dynamic Zod schema for validating step output based on input.
   * Allows for more flexible output structure based on the specific input provided.
   * @param input The input data for the step.
   * @returns A Zod schema defining structure and validation rules for the output of the step.
   */
  getOutputSchema?(params: {
    input: z.output<Input>;
    config: z.output<Config>;
  }): z.ZodType<z.output<Output>>;
}
