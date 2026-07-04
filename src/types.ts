export interface CreateOptions {
  name: string;
  lang: 'ts' | 'js';
  token: string;
  clientId: string;
  guildId: string;
  db: 'none' | 'mongo';
  prefix: string;
  bare?: boolean;
  install: boolean;
}

export type ComponentType = 'command' | 'button' | 'modal' | 'select';
export type CommandSubtype = 'slash' | 'prefix';
export type Lang = 'ts' | 'js';
