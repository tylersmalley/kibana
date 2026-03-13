/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { CommonTokenStream, CharStreams } from 'antlr4';
import type { SourceContext } from '../../antlr/painless_parser';
import { default as PainlessParser } from '../../antlr/painless_parser';
import { PainlessLexerEnhanced } from './lexer';
import type { MonacoEditorError } from '../../../../types';
import { ANTLRErrorListener } from '../../../../common/error_listener';

interface ErrorListenerTarget {
  addErrorListener: (listener: ANTLRErrorListener) => void;
  removeErrorListeners: () => void;
}

const parse = (
  code: string
): {
  source: SourceContext;
  errors: MonacoEditorError[];
} => {
  const inputStream = CharStreams.fromString(code);
  const lexer = new PainlessLexerEnhanced(inputStream);
  const painlessLangErrorListener = new ANTLRErrorListener();
  const tokenStream = new CommonTokenStream(lexer);
  const parser = new PainlessParser(
    tokenStream as unknown as ConstructorParameters<typeof PainlessParser>[0]
  );
  const lexerWithListeners = lexer as unknown as ErrorListenerTarget;
  const parserWithListeners = parser as unknown as ErrorListenerTarget;

  lexerWithListeners.removeErrorListeners();
  parserWithListeners.removeErrorListeners();

  lexerWithListeners.addErrorListener(painlessLangErrorListener);
  parserWithListeners.addErrorListener(painlessLangErrorListener);

  const errors: MonacoEditorError[] = painlessLangErrorListener.getErrors();

  return {
    source: parser.source(),
    errors,
  };
};

export const parseAndGetSyntaxErrors = (code: string): MonacoEditorError[] => {
  const { errors } = parse(code);
  return errors;
};
