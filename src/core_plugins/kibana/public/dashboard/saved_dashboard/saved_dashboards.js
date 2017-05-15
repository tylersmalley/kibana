import 'plugins/kibana/dashboard/saved_dashboard/saved_dashboard';
import { set } from 'lodash';
import { uiModules } from 'ui/modules';
import { savedObjectManagementRegistry } from 'plugins/kibana/management/saved_object_registry';
import { SavedObjectsClient } from 'ui/saved_objects';
import chrome from 'ui/chrome';

const module = uiModules.get('app/dashboard');

// Register this service with the saved object registry so it can be
// edited by the object editor.
savedObjectManagementRegistry.register({
  service: 'savedDashboards',
  title: 'dashboards'
});

module.service('savedDashboards', function ($http) {
  class SavedDashboards extends SavedObjectsClient {
    get(id) {
      return super.get('dashboard', id);
    }

    find(options = {}) {
      set(options, 'type', 'dashboard');
      return super.find(options);
    }

    get type() {
      return 'dashboard';
    }

    get loaderProperties() {
      return {
        name: 'dashboards',
        noun: 'Saved Dashboard',
        nouns: 'saved dashboards'
      };
    }

    get mapping() {
      return {
        title: 'text',
        hits: 'integer',
        description: 'text',
        panelsJSON: 'text',
        optionsJSON: 'text',
        uiStateJSON: 'text',
        version: 'integer',
        timeRestore: 'boolean',
        timeTo: 'keyword',
        timeFrom: 'keyword',
        refreshInterval: {
          type: 'object',
          properties: {
            display: { type: 'keyword' },
            pause: { type: 'boolean' },
            section: { type: 'integer' },
            value: { type: 'integer' }
          }
        }
      };
    }

    get fieldOrder() {
      return ['title', 'description'];
    }
  }

  return new SavedDashboards($http, chrome.getBasePath());
});
