/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

// Phoenix's subpath exports do not currently type-check correctly in this CJS package under NodeNext,
// so declare the public module surfaces we use against the package's public type subpaths.

declare module '@arizeai/phoenix-client/datasets' {
  import type { PhoenixClient } from '@arizeai/phoenix-client';
  import type { Example } from '@arizeai/phoenix-client/types/datasets';

  export interface CreateDatasetParams {
    client: PhoenixClient;
    name: string;
    description: string;
    examples: Example[];
  }

  export interface CreateDatasetResponse {
    datasetId: string;
  }

  export function createDataset(params: CreateDatasetParams): Promise<CreateDatasetResponse>;
}

declare module '@arizeai/phoenix-client/experiments' {
  import type { PhoenixClient } from '@arizeai/phoenix-client';
  import type { DatasetSelector } from '@arizeai/phoenix-client/types/datasets';
  import type {
    Evaluator,
    ExperimentTask,
    RanExperiment,
  } from '@arizeai/phoenix-client/types/experiments';
  import type { Logger } from '@arizeai/phoenix-client/types/logger';
  import type { DiagLogLevel } from '@opentelemetry/api';

  export interface RunExperimentParams {
    client: PhoenixClient;
    dataset: DatasetSelector;
    task: ExperimentTask;
    evaluators?: Evaluator[];
    experimentName?: string;
    experimentDescription?: string;
    experimentMetadata?: Record<string, unknown>;
    logger?: Logger;
    record?: boolean;
    concurrency?: number;
    dryRun?: number | boolean;
    setGlobalTracerProvider?: boolean;
    repetitions?: number;
    useBatchSpanProcessor?: boolean;
    diagLogLevel?: DiagLogLevel;
  }

  export function runExperiment(params: RunExperimentParams): Promise<RanExperiment>;
}
