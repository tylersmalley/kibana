export function createFindQuery(options) {
  const { type, filter } = options;

  if (!type && !filter) {
    return { query: { match_all: {} } };
  }

  const bool = { must: [], filter: [] };

  if (type) {
    bool.filter.push({
      term: {
        _type: type
      }
    });
  }

  if (filter) {
    // TODO: handle more than title and description for searching
    bool.must.push({
      multi_match: {
        query: filter,
        type: 'most_fields',
        fields: [ 'title', 'description' ]
      }
    });
  } else {
    bool.must.push({
      match_all: {}
    });
  }

  return { query: { bool } };
}
