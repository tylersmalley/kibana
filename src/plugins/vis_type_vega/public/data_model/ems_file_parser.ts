/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import { i18n } from '@kbn/i18n';
// @ts-ignore
import { IServiceSettings, FileLayer } from 'src/plugins/maps_legacy/public';
import { bypassExternalUrlCheck } from '../vega_view/vega_base_view';
import { Data, UrlObject, EmsQueryRequest } from './types';

/**
 * This class processes all Vega spec customizations,
 * converting url object parameters into query results.
 */
export class EmsFileParser {
  _serviceSettings: IServiceSettings;
  _fileLayersP?: Promise<FileLayer[]>;

  constructor(serviceSettings: IServiceSettings) {
    this._serviceSettings = serviceSettings;
  }

  // noinspection JSMethodCanBeStatic
  /**
   * Update request object, expanding any context-aware keywords
   */
  parseUrl(obj: Data, url: UrlObject) {
    if (typeof url.name !== 'string') {
      throw new Error(
        i18n.translate('visTypeVega.emsFileParser.missingNameOfFileErrorMessage', {
          defaultMessage:
            '{dataUrlParam} with {dataUrlParamValue} requires {nameParam} parameter (name of the file)',
          values: {
            dataUrlParam: '"data.url"',
            dataUrlParamValue: '{"%type%": "emsfile"}',
            nameParam: '"name"',
          },
        })
      );
    }

    // Optimization: so initiate remote request as early as we know that we will need it
    if (!this._fileLayersP) {
      this._fileLayersP = this._serviceSettings.getFileLayers();
    }
    return { obj, name: url.name };
  }

  /**
   * Process items generated by parseUrl()
   * @param {object[]} requests each object is generated by parseUrl()
   * @returns {Promise<void>}
   */
  async populateData(requests: EmsQueryRequest[]) {
    if (requests.length === 0) return;

    const layers = await this._fileLayersP;

    for (const { obj, name } of requests) {
      const foundLayer = layers?.find((v) => v.name === name);
      if (!foundLayer) {
        throw new Error(
          i18n.translate('visTypeVega.emsFileParser.emsFileNameDoesNotExistErrorMessage', {
            defaultMessage: '{emsfile} {emsfileName} does not exist',
            values: { emsfileName: JSON.stringify(name), emsfile: 'emsfile' },
          })
        );
      }

      // This URL can bypass loader sanitization at the later stage
      const url = await this._serviceSettings.getUrlForRegionLayer(foundLayer);
      obj.url = bypassExternalUrlCheck(url);
    }
  }
}
