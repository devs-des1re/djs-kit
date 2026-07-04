import 'dotenv/config';
import { Client, GatewayIntentBits, Collection } from 'discord.js';
import { loadCommands } from './handlers/commandLoader.js';
import { loadComponents } from './handlers/componentLoader.js';
import { registerCommandHandler } from './handlers/commandHandler.js';
import { registerComponentHandler } from './handlers/componentHandler.js';
import { logger } from './lib/logger.js';
import { config } from './config.js';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.slashCommands = new Collection();
client.prefixCommands = new Collection();
client.buttons = new Collection();
client.modals = new Collection();
client.selects = new Collection();

await loadCommands(client);
await loadComponents(client);

registerCommandHandler(client);
registerComponentHandler(client);

client.once('ready', (c) => {
  logger.success(`Logged in as ${client.user?.tag}`);
  logger.info(`Bound to guild: ${config.guildId}`);
  logger.info(`Prefix is set to: ${config.prefix}`);
});

if (!config.token) {
  console.error('[Error] No DISCORD_TOKEN provided. Please check your .env file.');
  process.exit(1);
}

await client.login(config.token);
