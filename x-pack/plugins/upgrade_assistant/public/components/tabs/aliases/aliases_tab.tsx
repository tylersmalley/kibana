/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import axios from 'axios';
import React, { Fragment } from 'react';

import {
  EuiAccordion,
  EuiBasicTable,
  EuiButton,
  EuiCallOut,
  EuiDescriptionList,
  EuiEmptyPrompt,
  EuiLink,
  EuiPageContent,
  EuiPageContentBody,
  EuiSpacer,
  EuiText,
} from '@elastic/eui';
import { FormattedMessage } from '@kbn/i18n/react';

import chrome from 'ui/chrome';

import { NEXT_MAJOR_VERSION } from '../../../../common/version';
import {
  GroupByOption,
  LevelFilterOption,
  LoadingState,
  UpgradeAssistantTabComponent,
} from '../../types';

export class AliasesTab extends UpgradeAssistantTabComponent<CheckupTabProps, CheckupTabState> {
  constructor(props: CheckupTabProps) {
    super(props);

    this.state = {
      // initialize to all filters
      currentFilter: LevelFilterOption.all,
      search: '',
      currentGroupBy: GroupByOption.message,
    };
  }

  public render() {
    const { alertBanner, deprecations, loadingState, setSelectedTabIndex } = this.props;
    const { currentFilter, search, currentGroupBy } = this.state;

    return (
      <Fragment>
        <EuiSpacer />
        <EuiText grow={false}>
          <p>
            <FormattedMessage
              id="xpack.upgradeAssistant.checkupTab.tabDetail"
              defaultMessage="These indices need your attention. Add aliases to these indices before upgrading to Elasticsearch {nextEsVersion}."
              values={{
                nextEsVersion: `${NEXT_MAJOR_VERSION}.x`,
              }}
            />
          </p>
        </EuiText>

        <EuiSpacer />

        {alertBanner && (
          <Fragment>
            {alertBanner}
            <EuiSpacer />
          </Fragment>
        )}

        <EuiPageContent>
          <EuiPageContentBody>
            {loadingState === LoadingState.Error ? (
              <EuiCallOut
                title={
                  <FormattedMessage
                    id="xpack.upgradeAssistant.checkupTab.errorCallout.calloutTitle"
                    defaultMessage="A network error occurred while retrieving the checkup results."
                  />
                }
                color="danger"
                iconType="cross"
              />
            ) : deprecations && deprecations.suggestions.length ? (
              <Fragment>{this.renderCheckupData()}</Fragment>
            ) : (
              <EuiEmptyPrompt
                iconType="faceHappy"
                title={
                  <h2>
                    <FormattedMessage
                      id="xpack.upgradeAssistant.checkupTab.noIssues.noIssuesTitle"
                      defaultMessage="All clear!"
                    />
                  </h2>
                }
                body={
                  <Fragment>
                    <p data-test-subj="upgradeAssistantIssueSummary">
                      <FormattedMessage
                        id="xpack.upgradeAssistant.checkupTab.noIssues.noIssuesLabel"
                        defaultMessage="You have no backwards compatibility issues."
                      />
                    </p>
                    <p>
                      <FormattedMessage
                        id="xpack.upgradeAssistant.checkupTab.noIssues.nextStepsDetail"
                        defaultMessage="Check the {overviewTabButton} for next steps."
                        values={{
                          overviewTabButton: (
                            <EuiLink onClick={() => setSelectedTabIndex(0)}>
                              <FormattedMessage
                                id="xpack.upgradeAssistant.checkupTab.noIssues.nextStepsDetail.overviewTabButtonLabel"
                                defaultMessage="Overview tab"
                              />
                            </EuiLink>
                          ),
                        }}
                      />
                    </p>
                  </Fragment>
                }
              />
            )}
          </EuiPageContentBody>
        </EuiPageContent>
      </Fragment>
    );
  }

  private loadData = () => {
    // TODO
  };

  private onAddAlias = async (indices: string[] = []) => {
    const resp = await axios.put(
      chrome.addBasePath(`/api/upgrade_assistant/ecs_aliases/${indices.join(',')}`),
      {},
      {
        headers: {
          'kbn-xsrf': chrome.getXsrfToken(),
        },
      }
    );
  };

  private renderCheckupData() {
    const columns = [
      {
        field: 'index',
        name: 'Index',
      },
      {
        field: 'fields',
        name: 'Fields',
        render: fields => {
          const keys = Object.keys(fields);
          const listItems = keys.map(field => ({ title: field, description: fields[field] }));

          return (
            <EuiAccordion
              // TODO id=
              buttonContent={`Aliases (${keys.length})`}
              paddingSize="l"
            >
              <EuiDescriptionList listItems={listItems} type="column" align="left" />
            </EuiAccordion>
          );
        },
      },
      {
        field: 'mapping',
        name: 'Actions',
        render: (mapping, { index }) => {
          return <EuiButton onClick={() => this.onAddAlias([index])}>Add alias</EuiButton>;
        },
      },
    ];

    return <EuiBasicTable items={this.props.deprecations.suggestions} columns={columns} />;
  }
}
