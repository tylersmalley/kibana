/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import React, { Suspense } from 'react';

interface DynamicComponentModule<TElement extends React.ComponentType<any>> {
  default: TElement;
}

interface DynamicInteropModule<TElement extends React.ComponentType<any>> {
  default: DynamicComponentModule<TElement>;
}

type Loader<TElement extends React.ComponentType<any>> = () => Promise<
  DynamicComponentModule<TElement> | DynamicInteropModule<TElement>
>;

const isDynamicInteropModule = <TElement extends React.ComponentType<any>>(
  value: TElement | DynamicComponentModule<TElement>
): value is DynamicComponentModule<TElement> => {
  return typeof value === 'object' && value !== null && 'default' in value;
};

/**
 * Options for the lazy loaded component
 */
export interface DynamicOptions {
  /* Fallback UI element to use when loading the component */
  fallback?: React.SuspenseProps['fallback'];
}

/**
 * Lazy load and wrap with Suspense any component.
 *
 * @example
 * // Lazy load a component
 * const Header = dynamic(() => import('./components/header'))
 * // Lazy load a component and use a fallback component while loading
 * const Header = dynamic(() => import('./components/header'), {fallback: <EuiLoadingSpinner />})
 * // Lazy load a named exported component
 * const MobileHeader = dynamic<MobileHeaderProps>(() => import('./components/header').then(mod => ({default: mod.MobileHeader})))
 */
export function dynamic<TElement extends React.ComponentType<any>, TRef = {}>(
  loader: Loader<TElement>,
  options: DynamicOptions = {}
) {
  const loadComponent = async (): Promise<DynamicComponentModule<TElement>> => {
    const module = await loader();
    const defaultExport = module.default;

    // Under NodeNext, dynamically importing CommonJS-compiled modules yields
    // `{ default: { default: Component, ...namedExports } }`.
    if (isDynamicInteropModule(defaultExport)) {
      return defaultExport;
    }

    return { default: defaultExport };
  };

  const Component = React.lazy(loadComponent);

  return React.forwardRef<TRef, React.ComponentPropsWithRef<TElement>>((props, ref) => (
    <Suspense fallback={options.fallback ?? null}>
      {React.createElement(Component, { ...props, ref })}
    </Suspense>
  ));
}
