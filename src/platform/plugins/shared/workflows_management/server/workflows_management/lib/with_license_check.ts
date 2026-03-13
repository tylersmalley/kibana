/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import type { RequestHandler } from '@kbn/core/server';
import { i18n } from '@kbn/i18n';
import type { CheckLicense } from '@kbn/licensing-plugin/server';
import type { LicenseType } from '@kbn/licensing-types';
import type { WorkflowsRequestHandlerContext } from '../../types';

const RequiredLicenseType: LicenseType = 'enterprise';

const checkLicense: CheckLicense = (license) => {
  if (!license.isAvailable || !license.isActive) {
    return {
      valid: false,
      message: i18n.translate(
        'plugins.workflowsManagement.checkLicense.unavailableOrInactiveLicense',
        { defaultMessage: 'License information is not available or license is inactive.' }
      ),
    };
  }

  if (!license.hasAtLeast(RequiredLicenseType)) {
    return {
      valid: false,
      message: i18n.translate('plugins.workflowsManagement.checkLicense.invalidLicense', {
        defaultMessage:
          'Your {licenseType} license does not support Workflows. Please upgrade to an {requiredLicenseType} license.',
        values: { licenseType: license.type, requiredLicenseType: RequiredLicenseType },
      }),
    };
  }

  return { valid: true, message: null };
};

/**
 * Wraps a request handler with a license check.
 * If the license is not valid, it will return a 403 error with a message.
 */
type WorkflowsRequestHandlerWrapper = <
  P,
  Q,
  B,
  Context extends WorkflowsRequestHandlerContext,
  THandler extends RequestHandler<P, Q, B, Context>
>(
  handler: THandler
) => THandler;

export const withLicenseCheck: WorkflowsRequestHandlerWrapper = (handler) =>
  (async (...args: Parameters<typeof handler>) => {
    const [context, request, response] = args;
    const { license } = await context.licensing;
    const licenseCheckResult = checkLicense(license);

    if (licenseCheckResult.valid) {
      return handler(context, request, response);
    }

    return response.forbidden({
      body: licenseCheckResult.message,
    });
  }) as typeof handler;
