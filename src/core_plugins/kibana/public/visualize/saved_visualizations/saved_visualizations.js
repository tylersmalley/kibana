import 'plugins/kibana/visualize/saved_visualizations/_saved_vis';
import { set } from 'lodash';
import { uiModules } from 'ui/modules';
import { savedObjectManagementRegistry } from 'plugins/kibana/management/saved_object_registry';
import { SavedObjectsClient } from 'ui/saved_objects';
import { SavedVisualization } from './saved_visualization';
import chrome from 'ui/chrome';

const module = uiModules.get('app/visualize');

// Register this service with the saved object registry so it can be
// edited by the object editor.
savedObjectManagementRegistry.register({
  service: 'savedVisualizations',
  title: 'visualizations'
});

module.service('savedVisualizations', function ($http) {
  class SavedVisualizations extends SavedObjectsClient {
    get(id) {
      return super.get(this.type, id);
    }

    find(options = {}) {
      set(options, 'type', this.type);
      return super.find(options);
    }

    get type() {
      return 'visualization';
    }

    get ObjectClass() {
      return SavedVisualization;
    }

    get fieldOrder() {
      return ['title', 'description'];
    }
  }

  return new SavedVisualizations($http, chrome.getBasePath());
});
