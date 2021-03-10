/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import { PluginInitializerContext } from 'src/core/public';
import { coreMock, applicationServiceMock } from 'src/core/public/mocks';
import { embeddablePluginMock } from 'src/plugins/embeddable/public/mocks';
import { expressionsPluginMock } from 'src/plugins/expressions/public/mocks';
import { dataPluginMock } from 'src/plugins/data/public/mocks';
import { usageCollectionPluginMock } from 'src/plugins/usage_collection/public/mocks';
import { uiActionsPluginMock } from 'src/plugins/ui_actions/public/mocks';
import { inspectorPluginMock } from 'src/plugins/inspector/public/mocks';
import { dashboardPluginMock } from 'src/plugins/dashboard/public/mocks';
import { savedObjectsPluginMock } from 'src/plugins/saved_objects/public/mocks';
import { VisualizationsPlugin } from './plugin';
import { Schemas } from './vis_types';
import { Schema, VisualizationsSetup, VisualizationsStart } from './';

const createSetupContract = (): VisualizationsSetup => ({
  createBaseVisualization: jest.fn(),
  registerAlias: jest.fn(),
  hideTypes: jest.fn(),
});

const createStartContract = (): VisualizationsStart => ({
  get: jest.fn(),
  all: jest.fn(),
  getAliases: jest.fn(),
  getByGroup: jest.fn(),
  unRegisterAlias: jest.fn(),
  savedVisualizationsLoader: {
    get: jest.fn(),
  } as any,
  showNewVisModal: jest.fn(),
  createVis: jest.fn(),
  convertFromSerializedVis: jest.fn(),
  convertToSerializedVis: jest.fn(),
  __LEGACY: {
    createVisEmbeddableFromObject: jest.fn(),
  },
});

const createInstance = async () => {
  const plugin = new VisualizationsPlugin({} as PluginInitializerContext);

  const setup = plugin.setup(coreMock.createSetup(), {
    data: dataPluginMock.createSetupContract(),
    embeddable: embeddablePluginMock.createSetupContract(),
    expressions: expressionsPluginMock.createSetupContract(),
    inspector: inspectorPluginMock.createSetupContract(),
    usageCollection: usageCollectionPluginMock.createSetupContract(),
  });
  const doStart = () =>
    plugin.start(coreMock.createStart(), {
      data: dataPluginMock.createStartContract(),
      expressions: expressionsPluginMock.createStartContract(),
      inspector: inspectorPluginMock.createStartContract(),
      uiActions: uiActionsPluginMock.createStartContract(),
      application: applicationServiceMock.createStartContract(),
      embeddable: embeddablePluginMock.createStartContract(),
      dashboard: dashboardPluginMock.createStartContract(),
      getAttributeService: jest.fn(),
      savedObjectsClient: coreMock.createStart().savedObjects.client,
      savedObjects: savedObjectsPluginMock.createStartContract(),
    });

  return {
    plugin,
    setup,
    doStart,
  };
};

export const createMockedVisEditorSchemas = (schemas: Array<Partial<Schema>>) =>
  new Schemas(schemas);

export const visualizationsPluginMock = {
  createSetupContract,
  createStartContract,
  createInstance,
};
