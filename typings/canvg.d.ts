/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

declare module 'canvg' {
  interface CanvgOptions {
    ignoreDimensions?: boolean;
    offsetX?: number;
    offsetY?: number;
  }

  interface CanvgInstance {
    resize(width: number, height: number): void;
    render(): Promise<void>;
  }

  export class Canvg {
    static fromString(
      ctx: CanvasRenderingContext2D,
      svg: string,
      options?: CanvgOptions
    ): CanvgInstance;
  }
}
