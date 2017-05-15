import { SavedObject } from 'ui/saved_objects';

export class SavedVisualization extends SavedObject {
  get attributeDefaults() {
    return {
      title: 'New Visualization',
      visState: (function () {
        if (!this.get('type')) {
          return null;
        }

        return { type: this.get('type') };
      }()),
      uiStateJSON: '{}',
      description: '',
      savedSearchId: this.get('savedSearchId'),
      version: 1
    };
  }

  get fieldOrder() {
    return ['title', 'description'];
  }

  get mapping() {
    return {
      title: 'text',
      visState: 'json',
      uiStateJSON: 'text',
      description: 'text',
      savedSearchId: 'keyword',
      version: 'integer'
    };
  }
}
