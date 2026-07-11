import type { DatabasePreset } from '../types.js';

export const databasePresets: DatabasePreset[] = [
  'none',
  'file',
  'sqlite',
  'postgres',
  'mysql',
  'mongo',
  'redis',
];

export function isDatabasePreset(value: string): value is DatabasePreset {
  return (databasePresets as string[]).includes(value);
}
