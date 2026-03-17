/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { act, render, screen } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { waitForEuiToolTipVisible } from '@elastic/eui/lib/test/rtl';

import { Tags } from './tags';

const TOOLTIP_DELAY_MS = 300;

describe('Tags', () => {
  let user: UserEvent;

  beforeEach(() => {
    jest.useFakeTimers();
    user = userEvent.setup({
      advanceTimers: jest.advanceTimersByTime,
      pointerEventsCheck: 0,
    });
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  describe('when list is short', () => {
    it('renders a comma-separated list of tags', () => {
      const tags = ['tag1', 'tag2'];
      render(<Tags tags={tags} />);

      expect(screen.getByTestId('agentTags')).toHaveTextContent('tag1, tag2');
    });
  });

  describe('when list is long', () => {
    it('renders a truncated list of tags with full list displayed in tooltip on hover', async () => {
      const tags = ['tag1', 'tag2', 'tag3', 'tag4', 'tag5'];
      render(<Tags tags={tags} />);

      const tagsNode = screen.getByTestId('agentTags');

      expect(tagsNode).toHaveTextContent('tag1, tag2, tag3 + 2 more');

      await user.hover(tagsNode);
      act(() => {
        jest.advanceTimersByTime(TOOLTIP_DELAY_MS);
      });
      await waitForEuiToolTipVisible();

      expect(screen.getByTestId('agentTagsTooltip')).toHaveTextContent(
        'tag1, tag2, tag3, tag4, tag5'
      );
    });

    it('renders a list of tags with tooltip on hover', async () => {
      const tags = ['tag1', 'tag2', 'tag3'];
      render(<Tags tags={tags} />);

      const tagsNode = screen.getByTestId('agentTags');

      expect(tagsNode).toHaveTextContent('tag1, tag2, tag3');

      await user.hover(tagsNode);
      act(() => {
        jest.advanceTimersByTime(TOOLTIP_DELAY_MS);
      });
      await waitForEuiToolTipVisible();

      expect(screen.getByTestId('agentTagsTooltip')).toHaveTextContent('tag1, tag2, tag3');
    });
  });
});
