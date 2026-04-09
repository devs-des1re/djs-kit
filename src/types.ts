export type PackageManager = 'npm' | 'yarn' | 'pnpm' | 'bun';

export interface BotConfig {
  botName: string;
  description: string;
  token: string;
  clientId: string;
  guildId: string;
  mongodbUri: string;
  packageManager: PackageManager;
  installDeps: boolean;
}

export interface CliOptions {
  yes: boolean;
  output: string;
}