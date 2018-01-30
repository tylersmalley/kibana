import { listEsContainer } from '../es_container';

export const name = 'List';
export const description =
  'Lists all running Elasticsearch containers for Kibana';

export async function run() {
  console.log('foo');
  const containers = await listEsContainer();
  console.log('containers', containers);
}
