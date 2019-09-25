import { ToolingLog } from './tooling_log';

export const defaultLog = new ToolingLog({
  level: 'verbose',
  writeTo: process.stdout,
});