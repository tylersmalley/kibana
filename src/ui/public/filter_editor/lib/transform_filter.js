/**
 * Converts:
 *   agent: {
 *     query: 'Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1; SV1; .NET CLR 1.1.4322)',
 *     type: 'phrase'
 *   }
 *
 * to:
 *   {
 *     match: {
 *       query: 'Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1; SV1; .NET CLR 1.1.4322)',
 *       type: 'phrase'
 *     },
 *     field: 'agent'
 *   }
 */

function transformMatch(match) {
  const keys = Object.keys(match);

  // TODO: handle exception
  const field = keys[0];

  return {
    match: match[field],
    field: field,
    clause: 'must'
  };
}

/**
 * Converts ElasticSearch filter to an array.
 *
 * This makes it much easier to add/edit/remove filters within Kibana
 *
 * @param {object} - ElasticSearch filter
 * @returns {array}
 */

export function destructured(structuredFilter) {
  let filters = [];

  if (structuredFilter.query) {
    return [ transformMatch(structuredFilter.query.match) ];
  }

  if (structuredFilter.bool) {
    Object.keys(structuredFilter.bool).forEach(function forEachClause(clause) {
      let filter = structuredFilter.bool[clause];

      filter.forEach(function forEachFilter(filter) {
        filters.push(Object.assign(transformMatch(filter.match), { clause: clause }));
      });
    });

    return filters;
  }
};

/**
 * Converts the Kibana filter to ElasticSearch
 *
 * @param {array} - array of filters
 * @return {object}
 */

export function structured(destructuredFilter) {
  let bool = {};

  destructuredFilter.forEach(function (filter) {
    let match = {};

    if (!bool.hasOwnProperty(filter.clause)) {
      bool[filter.clause] = [];
    }

    match[filter.field] = filter.match;
    bool[filter.clause].push({ match: match });
  });

  return { bool: bool };
}
