/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import { SavedObjectAttributes } from 'kibana/public';
import {
  PersistableState,
  PersistableStateDefinition,
  SerializableState,
} from 'src/plugins/kibana_utils/common';
import {
  EmbeddableFactory,
  EmbeddableInput,
  EmbeddableOutput,
  IEmbeddable,
  EmbeddableFactoryDefinition,
} from './lib/embeddables';

export type EmbeddableFactoryRegistry = Map<string, EmbeddableFactory>;
export type EnhancementsRegistry = Map<string, EnhancementRegistryItem>;

export interface EnhancementRegistryDefinition<P extends SerializableState = SerializableState>
  extends PersistableStateDefinition<P> {
  id: string;
}

export interface EnhancementRegistryItem<P extends SerializableState = SerializableState>
  extends PersistableState<P> {
  id: string;
}

export type EmbeddableFactoryProvider = <
  I extends EmbeddableInput = EmbeddableInput,
  O extends EmbeddableOutput = EmbeddableOutput,
  E extends IEmbeddable<I, O> = IEmbeddable<I, O>,
  T extends SavedObjectAttributes = SavedObjectAttributes
>(
  def: EmbeddableFactoryDefinition<I, O, E, T>
) => EmbeddableFactory<I, O, E, T>;
