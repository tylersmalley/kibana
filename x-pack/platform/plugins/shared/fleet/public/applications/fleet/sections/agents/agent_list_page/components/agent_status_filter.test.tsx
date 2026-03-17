/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import React from 'react';
import { act, render, screen } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { __IntlProvider as IntlProvider } from '@kbn/i18n-react';

import { AgentStatusFilter } from './agent_status_filter';

const PARTIAL_TOUR_TEXT = 'Some agents have become inactive and have been hidden';
const mockStorage: Record<any, any> = {};

jest.mock('../../../../../../hooks/use_core', () => {
  return {
    useStartServices: jest.fn(() => ({
      notifications: {
        tours: {
          isEnabled: jest.fn(() => true),
        },
      },
      uiSettings: {
        get: jest.fn(() => false),
      },
      storage: {
        get: jest.fn((key) => mockStorage[key]),
        set: jest.fn((key, val) => (mockStorage[key] = val)),
      },
    })),
  };
});

const renderComponent = (props: React.ComponentProps<typeof AgentStatusFilter>) => {
  return render(
    <IntlProvider locale="en">
      <AgentStatusFilter {...props} />
    </IntlProvider>
  );
};

describe('AgentStatusFilter', () => {
  let user: UserEvent;

  beforeEach(() => {
    jest.useFakeTimers();
    user = userEvent.setup({
      advanceTimers: jest.advanceTimersByTime,
      pointerEventsCheck: 0,
    });
    Object.keys(mockStorage).forEach((key) => {
      delete mockStorage[key];
    });
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  it('Renders all statuses', () => {
    const { getByText } = renderComponent({
      selectedStatus: [],
      onSelectedStatusChange: () => {},
      totalInactiveAgents: 0,
      isOpenByDefault: true,
    });

    expect(getByText('Healthy')).toBeInTheDocument();
    expect(getByText('Unhealthy')).toBeInTheDocument();
    expect(getByText('Updating')).toBeInTheDocument();
    expect(getByText('Offline')).toBeInTheDocument();
    expect(getByText('Inactive')).toBeInTheDocument();
    expect(getByText('Unenrolled')).toBeInTheDocument();
  });

  it('Shows tour and inactive count if first time seeing newly inactive agents', async () => {
    const { getByText } = renderComponent({
      selectedStatus: [],
      onSelectedStatusChange: () => {},
      totalInactiveAgents: 999,
    });

    expect(getByText(PARTIAL_TOUR_TEXT, { exact: false })).toBeVisible();

    const statusFilterButton = screen.getByTestId('agentList.statusFilter');

    await user.click(statusFilterButton);

    await act(async () => {
      jest.runOnlyPendingTimers();
    });

    expect(screen.getByTestId('agentList.agentStatusFilterOptions')).toBeInTheDocument();
    expect(screen.queryByText(PARTIAL_TOUR_TEXT, { exact: false })).not.toBeInTheDocument();
    expect(getByText('999')).toBeInTheDocument();
    expect(mockStorage['fleet.inactiveAgentsTour']).toEqual({ active: false });
  });

  it('Should not show tour if previously been dismissed', async () => {
    mockStorage['fleet.inactiveAgentsTour'] = { active: false };

    const { queryByText } = renderComponent({
      selectedStatus: [],
      onSelectedStatusChange: () => {},
      totalInactiveAgents: 999,
    });

    expect(queryByText(PARTIAL_TOUR_TEXT, { exact: false })).toBeNull();
  });

  it('Should should show difference between last seen inactive agents and total agents', async () => {
    mockStorage['fleet.lastSeenInactiveAgentsCount'] = '100';

    const { getByText } = renderComponent({
      selectedStatus: [],
      onSelectedStatusChange: () => {},
      totalInactiveAgents: 999,
    });

    await user.click(screen.getByTestId('agentList.statusFilter'));

    await act(async () => {
      jest.runOnlyPendingTimers();
    });

    expect(screen.getByTestId('agentList.agentStatusFilterOptions')).toBeInTheDocument();
    expect(getByText('899')).toBeInTheDocument();
  });
});
