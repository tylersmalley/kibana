export function savedSearchProvider(savedSearches) {
  return {
    name: 'searches',
    savedObjects: savedSearches
  };
}
