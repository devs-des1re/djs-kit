import type { ProjectPreset } from '../types.js';

export const projectPresets: ProjectPreset[] = [
  'bare',
  'utility',
  'moderation',
  'tickets',
  'community',
];

export function isProjectPreset(value: string): value is ProjectPreset {
  return (projectPresets as string[]).includes(value);
}
