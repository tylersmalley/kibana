/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { set } from '@kbn/safer-lodash-set';
import { z } from '@kbn/zod/v4';
import { get } from 'lodash';
import type { FieldErrors, FieldValues, Resolver } from 'react-hook-form';

type FormValues<TSchema extends z.ZodType> = z.input<TSchema> extends FieldValues
  ? z.input<TSchema>
  : FieldValues;

export const zodResolver = <TSchema extends z.ZodType>(
  schema: TSchema
): Resolver<FormValues<TSchema>> => {
  return async (data, _context, _options) => {
    try {
      const values = (await schema.parseAsync(data)) as FormValues<TSchema>;
      return {
        values,
        errors: {} as FieldErrors<FormValues<TSchema>>,
      };
    } catch (error: unknown) {
      if (!(error instanceof z.ZodError)) {
        throw error;
      }
      const zodError = error as z.ZodError<FormValues<TSchema>>;
      const errors = zodError.issues.reduce<FieldErrors<FormValues<TSchema>>>(
        (errorMap: FieldErrors<FormValues<TSchema>>, issue: z.core.$ZodIssue) => {
          const path = issue.path.join('.');
          if (!get(errorMap, path)) {
            set(errorMap, path, {
              type: issue.code,
              message: issue.message,
            });
          }
          return errorMap;
        },
        {} as FieldErrors<FormValues<TSchema>>
      );

      return {
        values: {} as FormValues<TSchema>,
        errors,
      };
    }
  };
};
