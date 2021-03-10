/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { AlertServices } from 'x-pack/plugins/alerting/server';
import { RuleAlertAction } from '../../../../common/detection_engine/types';
import { ruleActionsSavedObjectType } from './saved_object_mappings';
import { IRuleActionsAttributesSavedObjectAttributes } from './types';
import { getThrottleOptions, getRuleActionsFromSavedObject } from './utils';
import { RulesActionsSavedObject } from './get_rule_actions_saved_object';

interface CreateRuleActionsSavedObject {
  ruleAlertId: string;
  savedObjectsClient: AlertServices['savedObjectsClient'];
  actions: RuleAlertAction[] | undefined;
  throttle: string | null | undefined;
}

export const createRuleActionsSavedObject = async ({
  ruleAlertId,
  savedObjectsClient,
  actions = [],
  throttle,
}: CreateRuleActionsSavedObject): Promise<RulesActionsSavedObject> => {
  const ruleActionsSavedObject = await savedObjectsClient.create<IRuleActionsAttributesSavedObjectAttributes>(
    ruleActionsSavedObjectType,
    {
      ruleAlertId,
      actions,
      ...getThrottleOptions(throttle),
    }
  );

  return getRuleActionsFromSavedObject(ruleActionsSavedObject);
};
