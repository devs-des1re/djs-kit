export interface CreateOptions {
  name: string;
  lang: 'ts' | 'js';
  token: string;
  clientId: string;
  guildId: string;
  db: DatabasePreset;
  preset: ProjectPreset;
  prefix: string;
  bare?: boolean;
  install: boolean;
}

export type DatabasePreset = 'none' | 'file' | 'sqlite' | 'postgres' | 'mysql' | 'mongo' | 'redis';
export type ProjectPreset = 'bare' | 'utility' | 'moderation' | 'tickets' | 'community';
export type ComponentType = 'command' | 'button' | 'modal' | 'select' | 'event' | 'autocomplete' | 'context';
export type CommandSubtype = 'slash' | 'prefix';
export type ContextSubtype = 'user' | 'message';
export type Lang = 'ts' | 'js';
