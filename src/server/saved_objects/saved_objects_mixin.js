import { SavedObjectsClient } from './client';

import {
  createDeleteRoute,
  createFindRoute,
  createGetRoute,
} from './routes';

export function savedObjectsMixin(kbnServer, server) {
  const prereqs = {
    getSavedObjectsClient: {
      assign: 'savedObjectsClient',
      method(request, reply) {
        reply(new SavedObjectsClient(
          server.config().get('kibana.index'),
          request,
          server.plugins.elasticsearch.getCluster('admin').callWithRequest
        ));
      }
    },
  };

  server.route(createDeleteRoute(prereqs));
  server.route(createFindRoute(prereqs));
  server.route(createGetRoute(prereqs));
}
