import { format } from 'url';
import elasticsearch from 'elasticsearch';
import Docker from 'dockerode';
import stream from 'stream';

import { createCallCluster } from './create_call_cluster';
import { version } from '../../package.json';

const docker = new Docker({ socketPath: '/var/run/docker.sock' });

class EsContainer {

  /**
   * @param {Object} container
   * @param {Object} options
   * @property {Number} options.log
   * @property {String} options.username
   * @property {String} options.password
   */

  constructor(container, options = {}) {
    this.container = container;
    this.options = options;
    this.logs = new stream.PassThrough();

  }

  getClient() {
    if (!this.client) {
      this.client = new elasticsearch.Client({
        host: this.getUrl()
      });
    }

    return this.client;
  }

  getUrl() {
    return format(this.getUrlParts());
  }

  getUrlParts() {
    return {
      protocol: this.options.protocol || 'http',
      hostname: this.options.hostname || 'localhost',
      port: this.options.port || 9200,
      auth: `${this.options.username}:${this.options.password}`,
      username: this.options.username,
      password: this.options.password,
    };
  }

  getCallCluster() {
    return createCallCluster(this.getClient());
  }

  async start() {
    return await new Promise((resolve, reject) => {
      this.container.start().then(container => {
        container.logs({ follow: true, stdout: true, stderr: true }, (err, stream) => {
          if (err) {
            return reject(err.message);
          }

          stream.on('data', (chunk) => {
            const line = chunk.toString('utf8');

            if (line.match(/started/)) {
              resolve();
            }
          });

          container.modem.demuxStream(stream, this.logs, this.logs);
        });
      }).catch(reject);
    });
  }

  async stop() {
    if (this.client) {
      const c = this.client;
      this.client = null;
      await c.close();
    }

    if (this.container) {
      await this.container.stop();
    }
  }
}


/**
 * @param {Object} options
 * @property {Number} options.port
 * @property {String} options.username
 * @property {String} options.password
 * @property {Function} options.log
 */

export async function findEsContainer(options = {}) {
  const allContainers = await docker.listContainers();
  const containers = allContainers.filter(container => {
    const ports = container.Ports.map(c => c.PublicPort);

    if (options.port && ports.indexOf(options.port) > -1) {
      return true;
    }
  });

  return new Promise((resolve, reject) => {
    if (containers.length > 0) {
      const container = docker.getContainer(containers[0].Id);
      resolve(new EsContainer(container, options));
    } else {
      reject(`no containers found on port ${options.port}`);
    }
  });
}

/**
 * @param {Object} options
 * @property {Number} options.port
 * @property {String} options.username
 * @property {String} options.password
 * @property {Function} options.log
 */

export async function createEsContainer(options = {}) {
  const { port = 9200 } = options;
  const image = `docker.elastic.co/elasticsearch/elasticsearch-oss:${version}-SNAPSHOT`;
  const config = {
    Image: image,
    Labels: {
      'elasticsearch-version': version,
      'foo': 'bar'
    },
    ExposedPorts: {
      '9200/tcp': {},
    },
    HostConfig: {
      PortBindings: {
        '9200/tcp': [{
          HostPort: port.toString(),
        }],
      }
    }
  };

  const container = await docker.createContainer(config);
  return new EsContainer(container, options);
}

export async function listEsContainer() {
  const containers = await docker.listContainers();
  return containers.filter(container => {
    return container.Labels['elasticsearch-version'] !== undefined;
  });
}
