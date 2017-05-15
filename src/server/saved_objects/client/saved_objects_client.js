import Boom from 'boom';
import { Readable } from 'stream';
import { get, omit, pick } from 'lodash';
import { inherits } from 'util';

import {
  createFindQuery,
  createFilterPath,
  handleEsError,
} from './lib';

export class SavedObjectsClient {
  constructor(kibanaIndex, request, callWithRequest) {
    this._kibanaIndex = kibanaIndex;
    this._request = request;
    this._callWithRequest = callWithRequest;
  }

  async create(type, options = {}) {
    const body = omit(options, 'id');
    const id = get(options, 'id');
    const method = id ? 'create' : 'index';

    const response = await this._withKibanaIndex(method, {
      type,
      id,
      body
    });

    return Object.assign({ type: response._type, id: response._id }, body);
  }

  async delete(type, id) {
    const response = await this._withKibanaIndex('delete', {
      type,
      id,
      refresh: 'wait_for'
    });

    if (get(response, 'found') === false) {
      throw Boom.notFound();
    }

    return get(response, 'deleted', false);
  }

  async find(options = {}) {
    const { filter, type, fields } = options;
    const esOptions = pick(options, ['from', 'size', 'type']);

    if (fields) {
      esOptions.filterPath = createFilterPath(fields);
    }

    esOptions.body = createFindQuery({ filter, type });

    try {
      const response = await this._withKibanaIndex('search', esOptions);

      return {
        data: get(response, 'hits.hits', []).map(r => {
          return Object.assign({ id: r._id, type: r._type }, r._source);
        }),
        total: get(response, 'hits.total', 0)
      };
    } catch (error) {
      // attempt to mimic simple_query_string, swallow formatting error
      if (error.status === 400) {
        return {
          data: [],
          total: 0
        };
      }

      throw error;
    }
  }

  /**
   * @returns {Stream}
   */

  findAll(options = {}) {
    const { filter, type, fields } = options;
    const esOptions = pick(options, ['from', 'size', 'type']);
    const self = this;

    function SavedObjectsStream() {
      Readable.call(this, { objectMode: true });
    }

    inherits(SavedObjectsStream, Readable);

    SavedObjectsStream.prototype._read = function () {};

    const stream = new SavedObjectsStream();

    if (fields) {
      esOptions.filterPath = createFilterPath(fields);
    }

    esOptions.body = createFindQuery({ filter, type });
    esOptions.scroll = '30s';

    function getMoreUntilDone(response) {
      const hits = get(response, 'hits.hits', []);

      // collect the title from each response
      hits.forEach((r) => {
        stream.push(Object.assign({ id: r._id, type: r._type }, r._source));
      });

      if (hits.length > 0) {
        // ask elasticsearch for the next set of hits from this search
        self._callWithRequest(self._request, 'scroll', {
          scrollId: response._scroll_id,
          scroll: '30s'
        }).then(getMoreUntilDone);
      } else {
        stream.push(null); // done
      }

    }

    this._withKibanaIndex('search', esOptions).then(getMoreUntilDone);

    return stream;
  }

  async get(type, id) {
    const response = await this._withKibanaIndex('get', {
      type,
      id,
    });

    return Object.assign({ id: response._id, type: response._type }, response._source);
  }

  async update(type, id, body) {
    const response = await this._withKibanaIndex('update', {
      type,
      id,
      body,
      // TODO: trigger a refresh in case automatic refresh is disabled
      refresh: true,
    });

    return get(response, 'result') === 'updated';
  }

  async _withKibanaIndex(method, params) {
    try {
      return await this._callWithRequest(this._request, method, {
        ...params,
        index: this._kibanaIndex,
      });
    } catch (err) {
      throw handleEsError(err);
    }
  }
}
