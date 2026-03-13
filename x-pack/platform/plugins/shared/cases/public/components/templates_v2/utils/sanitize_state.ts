/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { TemplatesFindRequest } from '../../../../common/types/api/template/v1';
import { PAGE_SIZE_OPTIONS, SORT_ORDER_VALUES, DEFAULT_QUERY_PARAMS } from '../constants';

type SanitizableTemplatesFindRequest = Partial<Record<keyof TemplatesFindRequest, unknown>>;

export const sanitizeState = (
  state: SanitizableTemplatesFindRequest = {}
): Partial<TemplatesFindRequest> => {
  const { perPage, sortOrder, tags, author, ...rest } = state;

  const sanitized: Partial<TemplatesFindRequest> = { ...rest } as Partial<TemplatesFindRequest>;

  if (typeof perPage === 'number') {
    sanitized.perPage = Math.min(perPage, PAGE_SIZE_OPTIONS[PAGE_SIZE_OPTIONS.length - 1]);
  }

  if (sortOrder !== undefined) {
    sanitized.sortOrder =
      typeof sortOrder === 'string' &&
      SORT_ORDER_VALUES.includes(sortOrder as (typeof SORT_ORDER_VALUES)[number])
        ? (sortOrder as TemplatesFindRequest['sortOrder'])
        : DEFAULT_QUERY_PARAMS.sortOrder;
  }

  // Ensure tags is an array of strings
  if (tags !== undefined) {
    sanitized.tags = Array.isArray(tags)
      ? tags.filter((tag): tag is string => typeof tag === 'string' && tag.length > 0)
      : [];
  }

  // Ensure author is an array of strings
  if (author !== undefined) {
    sanitized.author = Array.isArray(author)
      ? author.filter((value): value is string => typeof value === 'string' && value.length > 0)
      : [];
  }

  return sanitized;
};
