/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import _ from 'lodash';

const DEFAULT_LIMIT = 20;
const DEFAULT_BATCH_SIZE = 30;

export class EcsAliases {
  public static convertToPropertyPath(propertyPath: string) {
    return propertyPath.split('.').join('.properties.');
  }

  public static mappingFromFields(fields: any) {
    return {
      properties: Object.keys(fields).reduce((acc, key) => {
        _.set(acc, EcsAliases.convertToPropertyPath(fields[key]), {
          type: 'alias',
          path: key,
        });
        return acc;
      }, {}),
    };
  }
  constructor(
    boundCallWithRequest: any,
    registrations: any,
    batchSize?: number = DEFAULT_BATCH_SIZE
  ) {
    this.boundCallWithRequest = boundCallWithRequest;
    this.registrations = registrations;
    this.batchSize = batchSize;
  }

  public async fetch(offset: number = 0, limit: number = DEFAULT_LIMIT, indices?: string[]) {
    if (!indices) {
      indices = await this.fetchIndices();
    }

    const suggestions = [];
    let batch = [];
    let nextOffset: number;

    for (let i: number = offset; i <= indices.length; i++) {
      batch.push(indices[i]);

      if (batch.length === this.batchSize || i === indices.length) {
        const selectedMappings = await this.boundCallWithRequest('indices.getMapping', {
          index: batch.join(','),
        });

        batch = []; // reset

        for (const [index, { mappings }] of Object.entries(selectedMappings)) {
          if (suggestions.length >= limit) {
            nextOffset = indices.indexOf(_.last(suggestions).index) + 1;
            break;
          }

          const mappingTypes = Object.keys(mappings);
          const mappingType = mappingTypes[0];

          // we are only interested in mappings with a single type
          // as Beats have never had multiple types within an index
          if (mappingTypes.length !== 1) {
            return;
          }

          const type = mappingTypes[0];
          const properties = mappings[type].properties;

          const fields = this.registrations.reduce((acc, convert) => {
            const aliasedFields = _.pick(convert(properties), (value, key) => {
              // exclude if source property does not exist
              if (!_.has(mappings, EcsAliases.convertToPropertyPath(`${mappingType}.${key}`))) {
                return false;
              }

              // exclude if destination property already exists
              if (_.has(mappings, EcsAliases.convertToPropertyPath(`${mappingType}.${value}`))) {
                return false;
              }

              return true;
            });

            return _.merge({}, acc, aliasedFields);
          }, {});

          if (Object.keys(fields).length > 0) {
            suggestions.push({
              index,
              type,
              fields,
              mapping: EcsAliases.mappingFromFields(fields),
            });
          }
        }
      }
    }

    return { nextOffset, suggestions };
  }

  private async create(indices: string[]) {
    const { suggestions } = await this.fetch(0, DEFAULT_LIMIT, indices);

    const updates = suggestions.map(async ({ mapping, index, type }) => {
      const update = await this.boundCallWithRequest('indices.putMapping', {
        index,
        type,
        body: mapping,
      });

      return update.acknowledged === true;
    });

    return Promise.all(updates);
  }

  private async fetchIndices() {
    const indices = await this.boundCallWithRequest('cat.indices', {
      h: 'index',
      format: 'json',
      // pri: true, // TODO: can this be set?
    });

    return indices.reduce((acc: any, current: any) => {
      acc.push(current.index);
      return acc;
    }, []);
  }
}
