import Boom from 'boom';
import { get } from 'lodash';

import {
  createFindQuery,
  createIdQuery,
  handleEsError,
  normalizeEsDoc,
  includedFields
} from './lib';

export const V6_TYPE = 'doc';

export class SavedObjectsClient {
  constructor(kibanaIndex, mappings, callAdminCluster) {
    this._kibanaIndex = kibanaIndex;
    this._mappings = mappings;
    this._callAdminCluster = callAdminCluster;
  }

  /**
   * Persists an object
   *
   * @param {string} type
   * @param {object} attributes
   * @param {object} [options={}]
   * @property {string} [options.id] - force id on creation, not recommended
   * @property {boolean} [options.overwrite=false]
   * @returns {promise} - { id, type, version, attributes }
  */
  async create(type, attributes = {}, options = {}) {
    const method = options.id && !options.overwrite ? 'create' : 'index';
    const response = await this._withKibanaIndex(method, {
      type: V6_TYPE,
      id: options.id ? `${type}:${options.id}` : undefined,
      body: {
        type,
        [type]: attributes
      },
      refresh: 'wait_for'
    });

    return normalizeEsDoc(response, { type, attributes });
  }

  /**
   * Creates multiple documents at once
   *
   * @param {array} objects - [{ type, id, attributes }]
   * @param {object} [options={}]
   * @property {boolean} [options.force=false] - overrides existing documents
   * @returns {promise} - [{ id, type, version, attributes, error: { message } }]
   */
  async bulkCreate(objects, options = {}) {
    const body = objects.reduce((acc, object) => {
      const method = object.id && !options.overwrite ? 'create' : 'index';

      acc.push({ [method]: {
        _type: V6_TYPE,
        _id: object.id ? `${object.type}:${object.id}` : undefined
      } });

      acc.push(Object.assign({},
        { type: object.type },
        { [object.type]: object.attributes }
      ));

      return acc;
    }, []);

    const response = await this._withKibanaIndex('bulk', {
      body,
      refresh: 'wait_for'
    });

    return get(response, 'items', []).map((resp, i) => {
      const method = Object.keys(resp)[0];
      const { id, type, attributes } = objects[i];

      return normalizeEsDoc(resp[method], {
        id,
        type,
        attributes,
        error: resp[method].error ? { message: get(resp[method], 'error.reason') } : undefined
      });
    });
  }

  /**
   * Deletes an object
   *
   * @param {string} type
   * @param {string} id
   * @returns {promise}
   */
  async delete(type, id) {
    const response = await this._withKibanaIndex('deleteByQuery', {
      body: createIdQuery({ type, id }),
      refresh: 'wait_for'
    });

    if (get(response, 'deleted') === 0) {
      throw Boom.notFound();
    }
  }

  /**
   * @param {object} [options={}]
   * @property {string} options.type
   * @property {string} options.search
   * @property {string} options.searchFields - see Elasticsearch Simple Query String
   *                                        Query field argument for more information
   * @property {integer} [options.page=1]
   * @property {integer} [options.perPage=20]
   * @property {string} options.sortField
   * @property {string} options.sortOrder
   * @property {array|string} options.fields
   * @returns {promise} - { saved_objects: [{ id, type, version, attributes }], total, per_page, page }
   */
  async find(options = {}) {
    const {
      type,
      search,
      searchFields,
      page = 1,
      perPage = 20,
      sortField,
      sortOrder,
      fields,
    } = options;

    const esOptions = {
      _source: includedFields(type, fields),
      size: perPage,
      from: perPage * (page - 1),
      body: createFindQuery(this._mappings, { search, searchFields, type, sortField, sortOrder })
    };

    const response = await this._withKibanaIndex('search', esOptions);

    return {
      saved_objects: get(response, 'hits.hits', []).map(hit => {
        return normalizeEsDoc(hit);
      }),
      total: get(response, 'hits.total', 0),
      per_page: perPage,
      page

    };
  }

  /**
   * Returns an array of objects by id
   *
   * @param {array} objects - an array ids, or an array of objects containing id and optionally type
   * @returns {promise} - { saved_objects: [{ id, type, version, attributes }] }
   * @example
   *
   * bulkGet([
   *   { id: 'one', type: 'config' },
   *   { id: 'foo', type: 'index-pattern' }
   * ])
   */
  async bulkGet(objects = []) {
    if (objects.length === 0) {
      return { saved_objects: [] };
    }

    const docs = objects.reduce((acc, { type, id }) => {
      return [...acc, {}, createIdQuery({ type, id })];
    }, []);

    const response = await this._withKibanaIndex('msearch', { body: docs });
    const responses = get(response, 'responses', []);

    return {
      saved_objects: responses.map((r, i) => {
        const [hit] = get(r, 'hits.hits', []);

        if (!hit) {
          return Object.assign({}, objects[i], {
            error: { statusCode: 404, message: 'Not found' }
          });
        }

        return normalizeEsDoc(hit, objects[i]);
      })
    };
  }

  /**
   * Gets a single object
   *
   * @param {string} type
   * @param {string} id
   * @returns {promise} - { id, type, version, attributes }
   */
  async get(type, id) {
    const response = await this._withKibanaIndex('search', { body: createIdQuery({ type, id }) });
    const [hit] = get(response, 'hits.hits', []);

    if (!hit) {
      throw Boom.notFound();
    }

    return normalizeEsDoc(hit);
  }

  /**
   * Updates an object
   *
   * @param {string} type
   * @param {string} id
   * @param {object} [options={}]
   * @property {integer} options.version - ensures version matches that of persisted object
   * @returns {promise}
   */
  async update(type, id, attributes, options = {}) {
    const response = await this._withKibanaIndex('update', {
      id,
      type: V6_TYPE,
      version: options.version,
      refresh: 'wait_for',
      body: {
        doc: {
          [type]: attributes
        }
      }
    });

    return normalizeEsDoc(response, { id, type, attributes });
  }

  async _withKibanaIndex(method, params) {
    try {
      return await this._callAdminCluster(method, {
        ...params,
        index: this._kibanaIndex,
      });
    } catch (err) {
      throw handleEsError(err);
    }
  }
}
