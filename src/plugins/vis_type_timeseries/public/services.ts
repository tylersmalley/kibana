/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import { I18nStart, SavedObjectsStart, IUiSettingsClient, CoreStart } from 'src/core/public';
import { createGetterSetter } from 'src/plugins/kibana_utils/public';
import { ChartsPluginSetup } from 'src/plugins/charts/public';
import { DataPublicPluginStart } from 'src/plugins/data/public';

export const [getUISettings, setUISettings] = createGetterSetter<IUiSettingsClient>('UISettings');

export const [getFieldFormats, setFieldFormats] = createGetterSetter<
  DataPublicPluginStart['fieldFormats']
>('FieldFormats');

export const [getSavedObjectsClient, setSavedObjectsClient] = createGetterSetter<SavedObjectsStart>(
  'SavedObjectsClient'
);

export const [getCoreStart, setCoreStart] = createGetterSetter<CoreStart>('CoreStart');

export const [getDataStart, setDataStart] = createGetterSetter<DataPublicPluginStart>('DataStart');

export const [getI18n, setI18n] = createGetterSetter<I18nStart>('I18n');

export const [getChartsSetup, setChartsSetup] = createGetterSetter<ChartsPluginSetup>(
  'ChartsPluginSetup'
);
