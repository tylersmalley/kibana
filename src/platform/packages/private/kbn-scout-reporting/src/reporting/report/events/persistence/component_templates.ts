/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import type { estypes } from 'elasticsearch-8.x'; // Switch to `@elastic/elasticsearch` when the CI cluster is upgraded.
import {
  buildkiteProperties,
  reporterProperties,
  testRunProperties,
  suiteProperties,
  testProperties,
} from './mappings';

export const buildkiteMappings: estypes.ClusterPutComponentTemplateRequest = {
  name: 'scout-test-event.mappings.buildkite',
  version: 3,
  template: {
    mappings: {
      properties: {
        buildkite: {
          type: 'object',
          properties: buildkiteProperties,
        },
      },
    },
  },
};

export const reporterMappings: estypes.ClusterPutComponentTemplateRequest = {
  name: 'scout-test-event.mappings.reporter',
  version: 1,
  template: {
    mappings: {
      properties: {
        reporter: {
          type: 'object',
          properties: reporterProperties,
        },
      },
    },
  },
};

export const testRunMappings: estypes.ClusterPutComponentTemplateRequest = {
  name: 'scout-test-event.mappings.test-run',
  version: 4,
  template: {
    mappings: {
      properties: {
        test_run: {
          type: 'object',
          properties: testRunProperties,
        },
      },
    },
  },
};

export const suiteMappings: estypes.ClusterPutComponentTemplateRequest = {
  name: 'scout-test-event.mappings.suite',
  version: 1,
  template: {
    mappings: {
      properties: {
        suite: {
          type: 'object',
          properties: suiteProperties,
        },
      },
    },
  },
};

export const testMappings: estypes.ClusterPutComponentTemplateRequest = {
  name: 'scout-test-event.mappings.test',
  version: 2,
  template: {
    mappings: {
      properties: {
        test: {
          type: 'object',
          properties: testProperties,
        },
      },
    },
  },
};
