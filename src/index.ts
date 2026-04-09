#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { Listr } from 'listr2';
import { getDefaultConfig, getInteractiveConfig } from './prompts.js';
import type { PackageManager } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEMPLATE_DIR = path.join(__dirname, '../template');

const program = new Command();

program
  .command('create')
  .description('Create a new Discord.js bot')
  .option('-y, --yes', 'Skip prompts and use defaults')
  .option('-o, --output <dir>', 'Output directory', process.cwd())
  .action(async (options) => {
    try {
      console.log(chalk.cyan('\nDiscord.js Bot Creator\n'));

      const config = options.yes ? await getDefaultConfig() : await getInteractiveConfig();
      
      let targetDir: string;
      let projectName: string;
      
      if (config.botName === '.') {
        targetDir = options.output;
        projectName = path.basename(targetDir);
        console.log(chalk.yellow(`\nUsing current directory: ${targetDir}`));
      } else {
        targetDir = path.join(options.output, config.botName);
        projectName = config.botName;
      }

      const installCommands: Record<PackageManager, string> = {
        npm: 'npm install',
        yarn: 'yarn',
        pnpm: 'pnpm install',
        bun: 'bun install',
      };

      const tasks = new Listr([
        {
          title: 'Preparing directory',
          task: async () => {
            if (config.botName === '.') {
              if (!await fs.pathExists(targetDir)) {
                throw new Error(`Directory does not exist: ${targetDir}`);
              }
              const files = await fs.readdir(targetDir);
              if (files.length > 0) {
                const { overwrite } = await import('inquirer').then(m => m.default.prompt([
                  {
                    type: 'confirm',
                    name: 'overwrite',
                    message: `Directory is not empty. Continue?`,
                    default: false,
                  },
                ]));
                if (!overwrite) {
                  throw new Error('Setup cancelled');
                }
              }
            } else {
              if (await fs.pathExists(targetDir)) {
                const { overwrite } = await import('inquirer').then(m => m.default.prompt([
                  {
                    type: 'confirm',
                    name: 'overwrite',
                    message: `Directory "${config.botName}" exists. Overwrite?`,
                    default: false,
                  },
                ]));
                
                if (!overwrite) {
                  throw new Error('Setup cancelled');
                }
                await fs.emptyDir(targetDir);
              } else {
                await fs.ensureDir(targetDir);
              }
            }
          },
        },
        {
          title: 'Copying template files',
          task: async () => {
            if (!await fs.pathExists(TEMPLATE_DIR)) {
              throw new Error(`Template directory not found: ${TEMPLATE_DIR}`);
            }

            await fs.copy(TEMPLATE_DIR, targetDir, {
              filter: (src) => {
                const basename = path.basename(src);
                return basename !== '.env';
              },
            });
          },
        },
        {
          title: 'Configuring package.json',
          task: async () => {
            const packageJsonPath = path.join(targetDir, 'package.json');
            if (await fs.pathExists(packageJsonPath)) {
              const pkg = await fs.readJson(packageJsonPath);
              pkg.name = projectName.toLowerCase().replace(/\s+/g, '-');
              pkg.description = config.description;
              await fs.writeJson(packageJsonPath, pkg, { spaces: 2 });
            }
          },
        },
        {
          title: 'Creating .env file',
          task: async () => {
            const envPath = path.join(targetDir, '.env');
            const envContent = `DISCORD_TOKEN=${config.token}
DISCORD_CLIENT_ID=${config.clientId}
DISCORD_GUILD_ID=${config.guildId}

MONGODB_URI=${config.mongodbUri}`;

            await fs.writeFile(envPath, envContent);
          },
        },
        {
          title: `Installing dependencies with ${config.packageManager}`,
          enabled: () => config.installDeps,
          task: async (_, task) => {
            const command = installCommands[config.packageManager];

            try {
              execSync(command, { cwd: targetDir, stdio: 'pipe' });
              task.output = chalk.green('Dependencies installed');
            } catch (error) {
              task.output = chalk.yellow(`Failed to install. Run '${command}' manually`);
            }
          },
        },
      ]);

      await tasks.run();

      console.log(chalk.green('\nBot created successfully!\n'));
      console.log(chalk.cyan('Next steps:'));
      
      if (config.botName !== '.') {
        console.log(`  cd ${config.botName}`);
      }
      
      if (!config.installDeps) {
        const installCmd = installCommands[config.packageManager];
        console.log(`  ${installCmd}`);
      }

      const startCommands: Record<PackageManager, string> = {
        npm: 'npm start',
        yarn: 'yarn start',
        pnpm: 'pnpm start',
        bun: 'bun start',
      };

      const devCommands: Record<PackageManager, string> = {
        npm: 'npm run dev',
        yarn: 'yarn dev',
        pnpm: 'pnpm dev',
        bun: 'bun run dev',
      };

      const deployCommands: Record<PackageManager, string> = {
        npm: 'npm run deploy',
        yarn: 'yarn deploy',
        pnpm: 'pnpm deploy',
        bun: 'bun run deploy',
      };

      console.log(`  ${deployCommands[config.packageManager]} (Deploy slash commands)`);
      console.log(`  ${startCommands[config.packageManager]} (Start the bot)`);
      console.log(`  ${devCommands[config.packageManager]} (Development with auto-reload)`);

      console.log(chalk.magenta('\nMake sure to enable intents in Discord Developer Portal:'));
      console.log('  - Guild Members Intent');
      console.log('  - Message Content Intent');

    } catch (error: any) {
      console.error(chalk.red('\nError:'), error.message);
      process.exit(1);
    }
  });

program.parse();