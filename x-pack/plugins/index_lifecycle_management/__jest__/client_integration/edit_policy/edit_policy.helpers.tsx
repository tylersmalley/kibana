/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import React from 'react';
import { act } from 'react-dom/test-utils';

import { registerTestBed, TestBedConfig } from '@kbn/test/target/jest/utils';

import { EditPolicy } from '../../../public/application/sections/edit_policy';
import { DataTierAllocationType } from '../../../public/application/sections/edit_policy/types';

import { Phases as PolicyPhases } from '../../../common/types';

import { KibanaContextProvider } from '../../../public/shared_imports';
import { createBreadcrumbsMock } from '../../../public/application/services/breadcrumbs.mock';

type Phases = keyof PolicyPhases;

import { POLICY_NAME } from './constants';
import { TestSubjects } from '../helpers';

jest.mock('@elastic/eui', () => {
  const original = jest.requireActual('@elastic/eui');

  return {
    ...original,
    // Mocking EuiComboBox, as it utilizes "react-virtualized" for rendering search suggestions,
    // which does not produce a valid component wrapper
    EuiComboBox: (props: any) => (
      <input
        data-test-subj={props['data-test-subj'] || 'mockComboBox'}
        data-currentvalue={props.selectedOptions}
        onChange={async (syntheticEvent: any) => {
          props.onChange([syntheticEvent['0']]);
        }}
      />
    ),
  };
});

const testBedConfig: TestBedConfig = {
  memoryRouter: {
    initialEntries: [`/policies/edit/${POLICY_NAME}`],
    componentRoutePath: `/policies/edit/:policyName`,
  },
  defaultProps: {
    getUrlForApp: () => {},
  },
};

const breadcrumbService = createBreadcrumbsMock();

const MyComponent = (props: any) => {
  return (
    <KibanaContextProvider services={{ breadcrumbService }}>
      <EditPolicy {...props} />
    </KibanaContextProvider>
  );
};

const initTestBed = registerTestBed<TestSubjects>(MyComponent, testBedConfig);

type SetupReturn = ReturnType<typeof setup>;

export type EditPolicyTestBed = SetupReturn extends Promise<infer U> ? U : SetupReturn;

export const setup = async () => {
  const testBed = await initTestBed();

  const { find, component, form } = testBed;

  const createFormToggleAction = (dataTestSubject: string) => async (checked: boolean) => {
    await act(async () => {
      form.toggleEuiSwitch(dataTestSubject, checked);
    });
    component.update();
  };

  function createFormSetValueAction<V extends string = string>(dataTestSubject: string) {
    return async (value: V) => {
      await act(async () => {
        form.setInputValue(dataTestSubject, value);
      });
      component.update();
    };
  }

  const setWaitForSnapshotPolicy = async (snapshotPolicyName: string) => {
    act(() => {
      find('snapshotPolicyCombobox').simulate('change', [{ label: snapshotPolicyName }]);
    });
    component.update();
  };

  const savePolicy = async () => {
    await act(async () => {
      find('savePolicyButton').simulate('click');
    });
    component.update();
  };

  const toggleRollover = createFormToggleAction('rolloverSwitch');

  const setMaxSize = async (value: string, units?: string) => {
    await act(async () => {
      find('hot-selectedMaxSizeStored').simulate('change', { target: { value } });
      if (units) {
        find('hot-selectedMaxSizeStoredUnits.select').simulate('change', {
          target: { value: units },
        });
      }
    });
    component.update();
  };

  const setMaxDocs = createFormSetValueAction('hot-selectedMaxDocuments');

  const setMaxAge = async (value: string, units?: string) => {
    await act(async () => {
      find('hot-selectedMaxAge').simulate('change', { target: { value } });
      if (units) {
        find('hot-selectedMaxAgeUnits.select').simulate('change', { target: { value: units } });
      }
    });
    component.update();
  };

  const toggleForceMerge = (phase: Phases) => createFormToggleAction(`${phase}-forceMergeSwitch`);

  const setForcemergeSegmentsCount = (phase: Phases) =>
    createFormSetValueAction(`${phase}-selectedForceMergeSegments`);

  const setBestCompression = (phase: Phases) => createFormToggleAction(`${phase}-bestCompression`);

  const setIndexPriority = (phase: Phases) =>
    createFormSetValueAction(`${phase}-phaseIndexPriority`);

  const enable = (phase: Phases) => createFormToggleAction(`enablePhaseSwitch-${phase}`);

  const warmPhaseOnRollover = createFormToggleAction(`warm-warmPhaseOnRollover`);

  const setMinAgeValue = (phase: Phases) => createFormSetValueAction(`${phase}-selectedMinimumAge`);

  const setMinAgeUnits = (phase: Phases) =>
    createFormSetValueAction(`${phase}-selectedMinimumAgeUnits`);

  const setDataAllocation = (phase: Phases) => async (value: DataTierAllocationType) => {
    act(() => {
      find(`${phase}-dataTierAllocationControls.dataTierSelect`).simulate('click');
    });
    component.update();
    await act(async () => {
      switch (value) {
        case 'node_roles':
          find(`${phase}-dataTierAllocationControls.defaultDataAllocationOption`).simulate('click');
          break;
        case 'node_attrs':
          find(`${phase}-dataTierAllocationControls.customDataAllocationOption`).simulate('click');
          break;
        default:
          find(`${phase}-dataTierAllocationControls.noneDataAllocationOption`).simulate('click');
      }
    });
    component.update();
  };

  const setSelectedNodeAttribute = (phase: Phases) =>
    createFormSetValueAction(`${phase}-selectedNodeAttrs`);

  const setReplicas = (phase: Phases) => async (value: string) => {
    await createFormToggleAction(`${phase}-setReplicasSwitch`)(true);
    await createFormSetValueAction(`${phase}-selectedReplicaCount`)(value);
  };

  const setShrink = async (value: string) => {
    await createFormToggleAction('shrinkSwitch')(true);
    await createFormSetValueAction('warm-selectedPrimaryShardCount')(value);
  };

  const setFreeze = createFormToggleAction('freezeSwitch');

  return {
    ...testBed,
    actions: {
      setWaitForSnapshotPolicy,
      savePolicy,
      hot: {
        setMaxSize,
        setMaxDocs,
        setMaxAge,
        toggleRollover,
        toggleForceMerge: toggleForceMerge('hot'),
        setForcemergeSegments: setForcemergeSegmentsCount('hot'),
        setBestCompression: setBestCompression('hot'),
        setIndexPriority: setIndexPriority('hot'),
      },
      warm: {
        enable: enable('warm'),
        warmPhaseOnRollover,
        setMinAgeValue: setMinAgeValue('warm'),
        setMinAgeUnits: setMinAgeUnits('warm'),
        setDataAllocation: setDataAllocation('warm'),
        setSelectedNodeAttribute: setSelectedNodeAttribute('warm'),
        setReplicas: setReplicas('warm'),
        setShrink,
        toggleForceMerge: toggleForceMerge('warm'),
        setForcemergeSegments: setForcemergeSegmentsCount('warm'),
        setBestCompression: setBestCompression('warm'),
        setIndexPriority: setIndexPriority('warm'),
      },
      cold: {
        enable: enable('cold'),
        setMinAgeValue: setMinAgeValue('cold'),
        setMinAgeUnits: setMinAgeUnits('cold'),
        setDataAllocation: setDataAllocation('cold'),
        setSelectedNodeAttribute: setSelectedNodeAttribute('cold'),
        setReplicas: setReplicas('cold'),
        setFreeze,
        setIndexPriority: setIndexPriority('cold'),
      },
      delete: {
        enable: enable('delete'),
        setMinAgeValue: setMinAgeValue('delete'),
        setMinAgeUnits: setMinAgeUnits('delete'),
      },
    },
  };
};
