import { findEsContainer, createEsContainer } from '../../es_container';
import { esTestConfig } from './es_test_config';

/**
 * @param {Object} options
 * @property {Number|String} options.port
 * @property {String} options.username
 * @property {String} options.password
 * @property {Function} options.log
 */

export async function findEsTestContainer(options = {}) {
  return findEsContainer({
    ...esTestConfig.getUrlParts,
    ...options
  });
}

/**
 * @param {Object} options
 * @property {Number} options.port
 * @property {String} options.username
 * @property {String} options.password
 * @property {Function} options.log
 */

export async function createEsTestContainer(options = {}) {
  return createEsContainer({
    ...esTestConfig.getUrlParts(),
    ...options
  });
}

export const startTimeout = 30000;
