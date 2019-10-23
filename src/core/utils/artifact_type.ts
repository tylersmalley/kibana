import { build } from '../../../package.json';

export const IS_KIBANA_DISTRIBUTABLE = build && build.distributable === true ? true : false;
export const IS_KIBANA_RELEASE = build && build.release === true ? true : false;