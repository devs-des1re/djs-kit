import inquirer from 'inquirer';
import type { BotConfig, PackageManager } from './types.js';

const defaultConfig = {
  botName: 'my-discord-bot',
  description: 'A Discord bot made with discord.js',
  token: '',
  clientId: '',
  guildId: '',
  mongodbUri: 'mongodb://localhost:27017/discord-bot',
  packageManager: 'npm' as PackageManager,
  installDeps: true,
};

export async function getDefaultConfig(): Promise<BotConfig> {
  return {
    botName: defaultConfig.botName,
    description: defaultConfig.description,
    token: 'YOUR_BOT_TOKEN',
    clientId: 'YOUR_CLIENT_ID',
    guildId: 'YOUR_GUILD_ID',
    mongodbUri: defaultConfig.mongodbUri,
    packageManager: defaultConfig.packageManager,
    installDeps: true,
  };
}

export async function getInteractiveConfig(): Promise<BotConfig> {
  const questions = [
    {
      type: 'input',
      name: 'botName',
      message: 'Bot name:',
      default: 'djs-kit',
      validate: (input: string) => {
        if (input.trim().length === 0) return 'Bot name is required';
        if (input === '..') return 'Bot name cannot be ".." (parent directory)';
        if (input.includes('/') || input.includes('\\')) return 'Bot name cannot contain path separators';
        return true;
      },
    },
    {
      type: 'input',
      name: 'description',
      message: 'Description:',
      default: defaultConfig.description,
    },
    {
      type: 'input',
      name: 'token',
      message: 'Discord Bot Token:',
      validate: (input: string) => input.trim().length > 0 || 'Token is required',
    },
    {
      type: 'input',
      name: 'clientId',
      message: 'Discord Client ID:',
      validate: (input: string) => input.trim().length > 0 || 'Client ID is required',
    },
    {
      type: 'input',
      name: 'guildId',
      message: 'Discord Guild ID:',
      validate: (input: string) => input.trim().length > 0 || 'Guild ID is required',
    },
    {
      type: 'input',
      name: 'mongodbUri',
      message: 'MongoDB URI:',
      default: defaultConfig.mongodbUri,
    },
    {
      type: 'list',
      name: 'packageManager',
      message: 'Package manager:',
      choices: ['npm', 'yarn', 'pnpm', 'bun'],
      default: defaultConfig.packageManager,
    },
    {
      type: 'confirm',
      name: 'installDeps',
      message: 'Install dependencies?',
      default: true,
    },
  ];

  const answers = await inquirer.prompt(questions);
  return answers as BotConfig;
}