/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { lazy } from 'react';
import { suspendedComponentWithProps } from '../lib/suspended_component_with_props';
import type { CreateConnectorFlyoutProps } from './action_connector_form/create_connector_flyout';
import type { EditConnectorFlyoutProps } from './action_connector_form/edit_connector_flyout';

export const ConnectorAddFlyout = suspendedComponentWithProps<CreateConnectorFlyoutProps>(
  lazy(() =>
    import('./action_connector_form/create_connector_flyout/index.js').then(
      ({ default: lazyModule }) => ({
        default: lazyModule.default,
      })
    )
  )
);
export const ConnectorEditFlyout = suspendedComponentWithProps<EditConnectorFlyoutProps>(
  lazy(() =>
    import('./action_connector_form/edit_connector_flyout/index.js').then(
      ({ default: lazyModule }) => ({
        default: lazyModule.default,
      })
    )
  )
);
export const ActionForm = suspendedComponentWithProps(
  lazy(() =>
    import('./action_connector_form/action_form.js').then(({ default: lazyModule }) => ({
      default: lazyModule.default,
    }))
  )
);

export const RuleStatusDropdown = suspendedComponentWithProps(
  lazy(() =>
    import('./rules_list/components/rule_status_dropdown.js').then(({ default: lazyModule }) => ({
      default: lazyModule.default,
    }))
  )
);
export const RuleTagFilter = suspendedComponentWithProps(
  lazy(() =>
    import('./rules_list/components/rule_tag_filter.js').then(({ default: lazyModule }) => ({
      default: lazyModule.default,
    }))
  )
);
export const RuleStatusFilter = suspendedComponentWithProps(
  lazy(() =>
    import('./rules_list/components/rule_status_filter.js').then(({ default: lazyModule }) => ({
      default: lazyModule.default,
    }))
  )
);
export const RuleEventLogList = suspendedComponentWithProps(
  lazy(() =>
    import('./rule_details/components/rule_event_log_list.js').then(({ default: lazyModule }) => ({
      default: lazyModule.default,
    }))
  )
);
export const RulesList = suspendedComponentWithProps(
  lazy(() =>
    import('./rules_list/components/rules_list.js').then(({ default: lazyModule }) => ({
      default: lazyModule.default,
    }))
  )
);
export const RulesListNotifyBadgeWithApi = suspendedComponentWithProps(
  lazy(() =>
    import('./rules_list/components/notify_badge/index.js').then(({ default: lazyModule }) => ({
      default: lazyModule.default,
    }))
  )
);
export const RuleSnoozeModal = suspendedComponentWithProps(
  lazy(() =>
    import('./rules_list/components/rule_snooze_modal.js').then(({ default: lazyModule }) => ({
      default: lazyModule.default,
    }))
  )
);
export const RuleDefinition = suspendedComponentWithProps(
  lazy(() =>
    import('./rule_details/components/rule_definition.js').then(({ default: lazyModule }) => ({
      default: lazyModule.default,
    }))
  )
);
export const RuleTagBadge = suspendedComponentWithProps(
  lazy(() =>
    import('./rules_list/components/rule_tag_badge.js').then(({ default: lazyModule }) => ({
      default: lazyModule.default,
    }))
  )
);
export const RuleStatusPanel = suspendedComponentWithProps(
  lazy(() =>
    import('./rule_details/components/rule_status_panel.js').then(({ default: lazyModule }) => ({
      default: lazyModule.default,
    }))
  )
);

export const UntrackAlertsModal = suspendedComponentWithProps(
  lazy(() =>
    import('./common/components/untrack_alerts_modal.js').then((module) => ({
      default: module.UntrackAlertsModal,
    }))
  )
);

export const GlobalRuleEventLogList = suspendedComponentWithProps(
  lazy(() =>
    import('./rule_details/components/global_rule_event_log_list.js').then(
      ({ default: lazyModule }) => ({
        default: lazyModule.default,
      })
    )
  )
);
