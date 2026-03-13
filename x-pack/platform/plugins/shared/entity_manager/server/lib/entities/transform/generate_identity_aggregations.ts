/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { EntityDefinition } from '@kbn/entities-schema';

type EntityIdentityField = EntityDefinition['identityFields'][number];

export function generateIdentityAggregations(definition: EntityDefinition) {
  return definition.identityFields.reduce<Record<string, unknown>>(
    (aggs: Record<string, unknown>, identityField: EntityIdentityField) => ({
      ...aggs,
      [`entity.identity.${identityField.field}`]: {
        filter: {
          exists: {
            field: identityField.field,
          },
        },
        aggs: {
          top_metric: {
            top_metrics: {
              metrics: {
                field: identityField.field,
              },
              sort: '_score',
            },
          },
        },
      },
    }),
    {}
  );
}
