/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { useState } from 'react';
import { XJsonMode } from '@kbn/ace';
import { XJson } from 'src/plugins/es_ui_shared/public';
import { StepDefineExposedState } from '../common';

const { useXJsonMode } = XJson;
const xJsonMode = new XJsonMode();

export const useAdvancedRuntimeMappingsEditor = (defaults: StepDefineExposedState) => {
  const stringifiedRuntimeMappings = JSON.stringify(defaults.runtimeMappings, null, 2);

  // Advanced editor for source config state
  const [runtimeMappingsUpdated, setRuntimeMappingsUpdated] = useState(
    defaults.runtimeMappingsUpdated
  );
  const [runtimeMappings, setRuntimeMappings] = useState(defaults.runtimeMappings);

  const [
    isRuntimeMappingsEditorSwitchModalVisible,
    setRuntimeMappingsEditorSwitchModalVisible,
  ] = useState(false);

  const [isRuntimeMappingsEditorEnabled, setRuntimeMappingsEditorEnabled] = useState(
    defaults.isRuntimeMappingsEditorEnabled
  );

  const [
    isRuntimeMappingsEditorApplyButtonEnabled,
    setRuntimeMappingsEditorApplyButtonEnabled,
  ] = useState(false);

  const [
    advancedEditorRuntimeMappingsLastApplied,
    setAdvancedEditorRuntimeMappingsLastApplied,
  ] = useState(stringifiedRuntimeMappings);

  const [advancedEditorRuntimeMappings, setAdvancedEditorRuntimeMappings] = useState(
    stringifiedRuntimeMappings
  );

  const {
    convertToJson,
    setXJson: setAdvancedRuntimeMappingsConfig,
    xJson: advancedRuntimeMappingsConfig,
  } = useXJsonMode(stringifiedRuntimeMappings ?? '');

  const applyRuntimeMappingsEditorChanges = () => {
    const parsedRuntimeMappings = JSON.parse(advancedRuntimeMappingsConfig);
    const prettySourceConfig = JSON.stringify(parsedRuntimeMappings, null, 2);
    setRuntimeMappingsUpdated(true);
    setRuntimeMappings(parsedRuntimeMappings);
    setAdvancedEditorRuntimeMappings(prettySourceConfig);
    setAdvancedEditorRuntimeMappingsLastApplied(prettySourceConfig);
    setRuntimeMappingsEditorApplyButtonEnabled(false);
  };

  // If switching to KQL after updating via editor - reset search
  const toggleRuntimeMappingsEditor = (reset = false) => {
    if (reset === true) {
      setRuntimeMappingsUpdated(false);
    }
    if (isRuntimeMappingsEditorEnabled === false) {
      setAdvancedEditorRuntimeMappingsLastApplied(advancedEditorRuntimeMappings);
    }

    setRuntimeMappingsEditorEnabled(!isRuntimeMappingsEditorEnabled);
    setRuntimeMappingsEditorApplyButtonEnabled(false);
  };

  return {
    actions: {
      applyRuntimeMappingsEditorChanges,
      setRuntimeMappingsEditorApplyButtonEnabled,
      setRuntimeMappingsEditorEnabled,
      setAdvancedEditorRuntimeMappings,
      setAdvancedEditorRuntimeMappingsLastApplied,
      setRuntimeMappingsEditorSwitchModalVisible,
      setRuntimeMappingsUpdated,
      toggleRuntimeMappingsEditor,
      convertToJson,
      setAdvancedRuntimeMappingsConfig,
    },
    state: {
      advancedEditorRuntimeMappings,
      advancedEditorRuntimeMappingsLastApplied,
      isRuntimeMappingsEditorApplyButtonEnabled,
      isRuntimeMappingsEditorEnabled,
      isRuntimeMappingsEditorSwitchModalVisible,
      runtimeMappingsUpdated,
      advancedRuntimeMappingsConfig,
      xJsonMode,
      runtimeMappings,
    },
  };
};
