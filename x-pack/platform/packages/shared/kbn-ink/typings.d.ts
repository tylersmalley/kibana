/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

declare module 'ink' {
  export type { Props as BoxProps } from '../../../../../node_modules/ink/build/components/Box';
  export { default as Box } from '../../../../../node_modules/ink/build/components/Box';
  export type { Props as TextProps } from '../../../../../node_modules/ink/build/components/Text';
  export { default as Text } from '../../../../../node_modules/ink/build/components/Text';
  export type { Key } from '../../../../../node_modules/ink/build/hooks/use-input';
  export { default as useInput } from '../../../../../node_modules/ink/build/hooks/use-input';
  export { default as useApp } from '../../../../../node_modules/ink/build/hooks/use-app';
}
