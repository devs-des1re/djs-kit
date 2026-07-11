import 'dotenv/config';
import { Client, Collection, GatewayIntentBits } from 'discord.js';
import { loadContextMenus } from '../handlers/contextLoader.js';
import { loadCommands } from '../handlers/commandLoader.js';
import { logger } from '../lib/logger.js';
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.slashCommands = new Collection();
client.prefixCommands = new Collection();
client.buttons = new Collection();
client.modals = new Collection();
client.selects = new Collection();
client.autocompleteHandlers = new Collection();
client.contextMenus = new Collection();
try {
    await loadContextMenus(client);
    await loadCommands(client);
    logger.success('Command sync complete.');
    client.destroy();
}
catch (error) {
    logger.error('Command sync failed.', error);
    client.destroy();
    process.exit(1);
}
