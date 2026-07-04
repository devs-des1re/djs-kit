import { Command } from 'commander';
import { handleCreate } from './create.js';
import { handleAdd } from './add.js';

const program = new Command();

program
  .name('djs-kit')
  .description('CLI to bootstrap and manage a discord.js v14 bot project')
  .version('0.1.0');

program
  .command('create <project-name>')
  .description('Scaffold a new single-guild discord.js bot project')
  .option('--lang <ts|js>', 'output language (ts or js) — omit to use interactive prompts')
  .option('--db <mongo|none>', 'database backend', 'none')
  .option('--guild-id <id>', 'Discord guild ID to bake into config (required in non-interactive mode)')
  .option('--prefix <prefix>', 'default command prefix')
  .option('--bare', 'do not generate example commands and components')
  .option('--no-install', 'skip running npm install after scaffold')
  .action(handleCreate);

const addCmd = program
  .command('add')
  .description('Generate a new command or component file inside a djs-kit project');

addCmd.addHelpText('after', `
Example calls:
  $ djs-kit create my-bot
  $ djs-kit add command ping
  $ djs-kit add button confirm_delete
  $ djs-kit add command admin/ban --type prefix
`);

addCmd
  .command('command <name>')
  .description('Generate a new command file. <name> accepts paths like moderation/kick')
  .option('--type <slash|prefix>', 'command type (slash or prefix)', 'slash')
  .action((name: string, opts: { type: string }) => handleAdd('command', name, opts));

addCmd
  .command('button <name>')
  .description('Generate a new button component. <name> accepts paths like moderation/confirmBan')
  .action((name: string) => handleAdd('button', name, {}));

addCmd
  .command('modal <name>')
  .description('Generate a new modal component')
  .action((name: string) => handleAdd('modal', name, {}));

addCmd
  .command('select <name>')
  .description('Generate a new select menu component')
  .action((name: string) => handleAdd('select', name, {}));

await program.parseAsync();
