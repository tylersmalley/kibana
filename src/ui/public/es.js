/**
 * @name es
 *
 * @description This is the result of calling esFactory. esFactory is exposed by the
 * elasticsearch.angular.js client.
 */

import 'elasticsearch-browser';
import _ from 'lodash';
import uiModules from 'ui/modules';

const plugins = [function (Client, config) {
  // esFactory automatically injects the AngularConnector to the config
  // https://github.com/elastic/elasticsearch-js/blob/master/src/lib/connectors/angular.js
  _.class(CustomAngularConnector).inherits(config.connectionClass);
  function CustomAngularConnector(host, config) {
    CustomAngularConnector.Super.call(this, host, config);

    this.request = _.wrap(this.request, function (request, params, cb) {
      if (String(params.method).toUpperCase() === 'GET') {
        params.query = _.defaults({ _: Date.now() }, params.query);
      }

      return request.call(this, params, cb);
    });
  }

  config.connectionClass = CustomAngularConnector;
}];


// share the clients amongst all apps
let es;
let esAdmin;

uiModules
  .get('kibana', ['elasticsearch', 'kibana/config'])
  .service('es', function (esFactory, esUrl, esApiVersion, esRequestTimeout) {
    if (es) return es;
    es = esFactory({
      host: esUrl,
      log: 'info',
      requestTimeout: esRequestTimeout,
      apiVersion: esApiVersion,
      plugins
    });

    return es;
  })
  .service('esAdmin', function (esFactory, esAdminUrl, esApiVersion, esRequestTimeout) {
    if (esAdmin) return esAdmin;
    esAdmin = esFactory({
      host: esAdminUrl,
      log: 'info',
      requestTimeout: esRequestTimeout,
      apiVersion: esApiVersion,
      plugins
    });

    return esAdmin;
  });
