import 'dotenv/config';
import { Client, GatewayIntentBits, Collection } from 'discord.js';
import { loadCommands } from './handlers/commandLoader.js';
import { loadComponents } from './handlers/componentLoader.js';
import { loadEvents } from './handlers/eventLoader.js';
import { loadAutocompleteHandlers } from './handlers/autocompleteLoader.js';
import { loadContextMenus } from './handlers/contextLoader.js';
import { registerCommandHandler } from './handlers/commandHandler.js';
import { registerComponentHandler } from './handlers/componentHandler.js';
import { logger } from './lib/logger.js';
import { registerRuntimeHandlers } from './lib/runtime.js';
import { config } from './config.js';

const intents = [
  GatewayIntentBits.Guilds,
  GatewayIntentBits.GuildMembers,
  GatewayIntentBits.GuildMessages,
];

if (config.commandMode !== 'slash') {
  intents.push(GatewayIntentBits.MessageContent);
}

const client = new Client({
  intents,
});

client.slashCommands = new Collection();
client.prefixCommands = new Collection();
client.buttons = new Collection();
client.modals = new Collection();
client.selects = new Collection();
client.autocompleteHandlers = new Collection();
client.contextMenus = new Collection();

registerRuntimeHandlers(client);

try {
  await loadEvents(client);
  await loadAutocompleteHandlers(client);
  await loadContextMenus(client);
  await loadCommands(client);
  await loadComponents(client);

  registerCommandHandler(client);
  registerComponentHandler(client);

  await client.login(config.token);
} catch (error) {
  logger.error('Failed to start bot.', error);
  process.exit(1);
}
