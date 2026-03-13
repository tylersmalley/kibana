/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { lazy } from 'react';
import type { ConnectorIconProps } from './types';

/**
 * Icon exports for connector specs. Add new icon exports here as they are created.
 * Convention:
 * - key should match the connector.id with the leading dot (e.g., '.virustotal')
 * - value should be a lazy component that imports the icon
 * - chunk name should match the connector.id (e.g., 'connectorIconVirustotal')
 */

export const ConnectorIconsMap: Map<
  string,
  React.LazyExoticComponent<React.ComponentType<ConnectorIconProps>>
> = new Map([
  [
    '.virustotal',
    lazy(() =>
      import(
        /* webpackChunkName: "connectorIconVirustotal" */ './specs/virustotal/icon/index.js'
      ).then(({ default: lazyModule }) => ({ default: lazyModule.default }))
    ),
  ],
  [
    '.alienvault-otx',
    lazy(() =>
      import(
        /* webpackChunkName: "connectorIconAlienvaultOtx" */ './specs/alienvault_otx/icon/index.js'
      ).then(({ default: lazyModule }) => ({ default: lazyModule.default }))
    ),
  ],
  [
    '.notion',
    lazy(() =>
      import(/* webpackChunkName: "connectorNotion" */ './specs/notion/icon/index.js').then(
        ({ default: lazyModule }) => ({ default: lazyModule.default })
      )
    ),
  ],
  [
    '.pagerduty-v2',
    lazy(() =>
      import(
        /* webpackChunkName: "connectorIconPagerduty" */ './specs/pagerduty/icon/index.js'
      ).then(({ default: lazyModule }) => ({ default: lazyModule.default }))
    ),
  ],
  [
    '.pagerduty',
    lazy(() =>
      import(
        /* webpackChunkName: "connectorIconPagerduty" */ './specs/pagerduty/icon/index.js'
      ).then(({ default: lazyModule }) => ({ default: lazyModule.default }))
    ),
  ],
  [
    '.brave-search',
    lazy(() =>
      import(
        /* webpackChunkName: "connectorIconBraveSearch" */ './specs/brave_search/icon/index.js'
      ).then(({ default: lazyModule }) => ({ default: lazyModule.default }))
    ),
  ],
  [
    '.github',
    lazy(() =>
      import(/* webpackChunkName: "connectorIconGithub" */ './specs/github/icon/index.js').then(
        ({ default: lazyModule }) => ({ default: lazyModule.default })
      )
    ),
  ],
  [
    '.jina',
    lazy(() =>
      import(/* webpackChunkName: "connectorIconJina" */ './specs/jina/icon/jina.js').then(
        ({ default: lazyModule }) => ({ default: lazyModule.default })
      )
    ),
  ],
  [
    '.sharepoint-online',
    lazy(() =>
      import(
        /* webpackChunkName: "connectorIconsharepointonline" */ './specs/sharepoint_online/icon/index.js'
      ).then(({ default: lazyModule }) => ({ default: lazyModule.default }))
    ),
  ],
  [
    '.salesforce',
    lazy(() =>
      import(
        /* webpackChunkName: "connectorIconSalesforce" */ './specs/salesforce/icon/index.js'
      ).then(({ default: lazyModule }) => ({ default: lazyModule.default }))
    ),
  ],
  [
    '.abuseipdb',
    lazy(() =>
      import(
        /* webpackChunkName: "connectorIconAbuseipdb" */ './specs/abuseipdb/icon/index.js'
      ).then(({ default: lazyModule }) => ({ default: lazyModule.default }))
    ),
  ],
  [
    '.greynoise',
    lazy(() =>
      import(
        /* webpackChunkName: "connectorIconGreynoise" */ './specs/greynoise/icon/index.js'
      ).then(({ default: lazyModule }) => ({ default: lazyModule.default }))
    ),
  ],
  [
    '.shodan',
    lazy(() =>
      import(/* webpackChunkName: "connectorIconShodan" */ './specs/shodan/icon/index.js').then(
        ({ default: lazyModule }) => ({ default: lazyModule.default })
      )
    ),
  ],
  [
    '.urlvoid',
    lazy(() =>
      import(/* webpackChunkName: "connectorIconUrlvoid" */ './specs/urlvoid/icon/index.js').then(
        ({ default: lazyModule }) => ({ default: lazyModule.default })
      )
    ),
  ],
  [
    '.jira-cloud',
    lazy(() =>
      import(
        /* webpackChunkName: "connectorIconJiraCloud" */ './specs/atlassian/jira-cloud/icon/index.js'
      ).then(({ default: lazyModule }) => ({ default: lazyModule.default }))
    ),
  ],
  [
    '.google_drive',
    lazy(() =>
      import(
        /* webpackChunkName: "connectorIconGoogleDrive" */ './specs/google_drive/icon/index.js'
      ).then(({ default: lazyModule }) => ({ default: lazyModule.default }))
    ),
  ],
  [
    '.slack2',
    lazy(() =>
      import(/* webpackChunkName: "connectorIconSlack2" */ './specs/slack/icon/index.js').then(
        ({ default: lazyModule }) => ({ default: lazyModule.default })
      )
    ),
  ],

  [
    '.firecrawl',
    lazy(() =>
      import(
        /* webpackChunkName: "connectorIconFirecrawl" */ './specs/firecrawl/icon/index.js'
      ).then(({ default: lazyModule }) => ({ default: lazyModule.default }))
    ),
  ],
  [
    '.zoom',
    lazy(() =>
      import(/* webpackChunkName: "connectorIconZoom" */ './specs/zoom/icon/index.js').then(
        ({ default: lazyModule }) => ({ default: lazyModule.default })
      )
    ),
  ],
  [
    '.zendesk',
    lazy(() =>
      import(/* webpackChunkName: "connectorIconZendesk" */ './specs/zendesk/icon/index.js').then(
        ({ default: lazyModule }) => ({ default: lazyModule.default })
      )
    ),
  ],
  [
    '.servicenow_search',
    lazy(() =>
      import(
        /* webpackChunkName: "connectorIconservicenowsearch" */ './specs/servicenow_search/icon/index.js'
      ).then(({ default: lazyModule }) => ({ default: lazyModule.default }))
    ),
  ],
  [
    '.tavily',
    lazy(() =>
      import(/* webpackChunkName: "connectorIconTavily" */ './specs/tavily/icon/index.js').then(
        ({ default: lazyModule }) => ({ default: lazyModule.default })
      )
    ),
  ],
  [
    '.google_calendar',
    lazy(() =>
      import(
        /* webpackChunkName: "connectorIconGoogleCalendar" */ './specs/google_calendar/icon/index.js'
      ).then(({ default: lazyModule }) => ({ default: lazyModule.default }))
    ),
  ],
  [
    '.aws_lambda',
    lazy(() =>
      import(
        /* webpackChunkName: "connectorIconAwsLambda" */ './specs/aws_lambda/icon/index.js'
      ).then(({ default: lazyModule }) => ({ default: lazyModule.default }))
    ),
  ],
]);
