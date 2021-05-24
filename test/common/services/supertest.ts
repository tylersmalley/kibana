/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import { FtrProviderContext } from 'test/functional/ftr_provider_context';
import { format as formatUrl } from 'url';

import supertest from 'supertest';

export function createKibanaSupertestProvider({
  certificateAuthorities,
  kibanaUrl,
}: {
  certificateAuthorities?: string | string[] | Buffer | Buffer[];
  kibanaUrl?: string;
} = {}) {
  return function ({ getService }: FtrProviderContext) {
    const config = getService('config');
    const kibanaServerUrl = kibanaUrl ?? formatUrl(config.get('servers.kibana'));

    return certificateAuthorities
      ? supertest.agent(kibanaServerUrl, { ca: certificateAuthorities })
      : supertest(kibanaServerUrl);
  };
}

export function KibanaSupertestWithoutAuthProvider({ getService }: FtrProviderContext) {
  const config = getService('config');
  const kibanaServerConfig = config.get('servers.kibana');

  return supertest(
    formatUrl({
      ...kibanaServerConfig,
      auth: false,
    })
  );
}

export function ElasticsearchSupertestProvider({ getService }: FtrProviderContext) {
  const config = getService('config');
  const esServerConfig = config.get('servers.elasticsearch');
  const elasticSearchServerUrl = formatUrl(esServerConfig);

  let agentOptions = {};
  if ('certificateAuthorities' in esServerConfig) {
    agentOptions = { ca: esServerConfig!.certificateAuthorities };
  }

  return supertest.agent(elasticSearchServerUrl, agentOptions);
}

export function ElasticsearchSupertestWithoutAuthProvider({ getService }: FtrProviderContext) {
  const config = getService('config');
  const esServerConfig = config.get('servers.elasticsearch');

  return supertest(
    formatUrl({
      ...esServerConfig,
      auth: false,
    })
  );
}
