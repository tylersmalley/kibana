import { uiRegistry } from 'ui/registry/_registry';

export const SavedObjectRegistryProvider = uiRegistry({
  name: 'savedObjects',
  index: ['name'],
  order: ['name']
});
