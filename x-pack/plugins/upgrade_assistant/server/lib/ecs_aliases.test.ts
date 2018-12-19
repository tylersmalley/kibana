/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import _ from 'lodash';

import fakeCatIndices from './__fixtures__/fake_cat_indices.json';
import fakeMappings from './__fixtures__/fake_mappings.json';
import { EcsAliases } from './ecs_aliases';

describe('EcsAliases.mappingFromFields', () => {
  it('converts single field', () => {
    const fields = { foo: 'bar' };
    expect(EcsAliases.mappingFromFields(fields)).toEqual({
      properties: {
        bar: {
          path: 'foo',
          type: 'alias',
        },
      },
    });
  });

  it('converts multiple nested fields', () => {
    const fields = { 'beat.hostname': 'agent.hostname', 'beat.name': 'agent.name' };
    expect(EcsAliases.mappingFromFields(fields)).toEqual({
      properties: {
        agent: {
          properties: {
            hostname: {
              path: 'beat.hostname',
              type: 'alias',
            },
            name: {
              path: 'beat.name',
              type: 'alias',
            },
          },
        },
      },
    });
  });
});

describe('EcsAliases.convertToPropertyPath', () => {
  it('ignores if top level', () => {
    expect(EcsAliases.convertToPropertyPath('foo')).toEqual('foo');
  });

  it('converts to property path', () => {
    expect(EcsAliases.convertToPropertyPath('foo.bar')).toEqual('foo.properties.bar');
  });

  it('converts deeply nested property path', () => {
    expect(EcsAliases.convertToPropertyPath('foo.bar.baz')).toEqual(
      'foo.properties.bar.properties.baz'
    );
  });
});

describe('EcsAliases', () => {
  const registrations = [
    () => {
      return {
        'old.foo': 'new.newFoo',
      };
    },
    () => {
      return {
        'old.bar': 'new.newBar',
        'old.baz': 'new.newBaz',
      };
    },
  ];

  const boundCallWithRequest = jest.fn().mockImplementation(async (api, { index }) => {
    if (api === 'cat.indices') {
      return Promise.resolve(fakeCatIndices);
    } else if (api === 'indices.getMapping') {
      return Promise.resolve(_.pick(fakeMappings, index.split(',')));
    } else {
      throw new Error(`Unexpected API call: ${api}`);
    }
  });

  describe('fetch', () => {
    it('loads indices', async () => {
      const aliases = new EcsAliases(boundCallWithRequest, registrations, 15);
      const fetch = await aliases.fetch(0, 10);

      expect(fetch).toMatchSnapshot();
    });

    it('loads partial page at offset', async () => {
      const limit = 10;
      const aliases = new EcsAliases(boundCallWithRequest, registrations, 15);
      const fetch = await aliases.fetch(13, limit);

      expect(fetch.nextOffset).toBe(undefined);
      expect(fetch.suggestions).toHaveLength(9);

      expect(fetch).toMatchSnapshot();
    });
  });
});
