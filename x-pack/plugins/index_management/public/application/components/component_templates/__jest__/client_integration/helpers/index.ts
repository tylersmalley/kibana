/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { setup as componentTemplatesListSetup } from './component_template_list.helpers';
import { setup as componentTemplateDetailsSetup } from './component_template_details.helpers';

export { nextTick, getRandomString, findTestSubject } from '@kbn/test/target/jest/utils';

export { setupEnvironment, appDependencies } from './setup_environment';

export const pageHelpers = {
  componentTemplateList: { setup: componentTemplatesListSetup },
  componentTemplateDetails: { setup: componentTemplateDetailsSetup },
};
