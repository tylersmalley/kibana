import { set } from 'lodash';
import { uiModules } from 'ui/modules';
import { savedObjectManagementRegistry } from 'plugins/kibana/management/saved_object_registry';
import { SavedObjectsClient } from 'ui/saved_objects';
import chrome from 'ui/chrome';

const module = uiModules.get('discover/saved_searches');

// Register this service with the saved object registry so it can be
// edited by the object editor.
savedObjectManagementRegistry.register({
  service: 'savedSearches',
  title: 'searches'
});

module.service('savedSearches', function ($http, kbnUrl) {
  class SavedSearches extends SavedObjectsClient {
    get(id) {
      return super.get('search', id);
    }

    find(options = {}) {
      set(options, 'type', 'search');

      return super.find(options);
    }

    get loaderProperties() {
      return {
        name: 'searches',
        noun: 'Saved Search',
        nouns: 'saved searches'
      };
    }

    get type() {
      return 'visualization';
    }

    urlFor(id) {
      // TODO: find correct URL
      return kbnUrl.eval('#/dashboard/edit/{{id}}', { id: id });
    }

    get defaults() {
      return {
        title: 'New Saved Search',
        description: '',
        columns: [],
        hits: 0,
        sort: [],
        version: 1
      };
    }

    get mapping() {
      return {
        title: 'text',
        description: 'text',
        hits: 'integer',
        columns: 'keyword',
        sort: 'keyword',
        version: 'integer'
      };
    }

    get fieldOrder() {
      return ['title', 'description'];
    }
  }

  return new SavedSearches($http, chrome.getBasePath());
});
