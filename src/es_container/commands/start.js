import chalk from 'chalk';

import { createEsContainer } from '../es_container';

export const name = 'Start';
export const description =
  'Starts an Elasticsearch container';

export async function run(options) {
  const { port = 9200 } = options;
  const container = await createEsContainer({ port });

  console.log(
    chalk.bold(`Starting Elasticsearch on port ${port}`)
  );

  container.logs.on('data', chunk => {
    process.stdout.write(`  ${chunk.toString('utf8')}`);
  });

  await container.start();

  console.log(
    chalk.bold.green(`Elasticsearch started on port ${port}`)
  );
}
