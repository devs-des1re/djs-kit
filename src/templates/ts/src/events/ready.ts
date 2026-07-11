import { Events } from 'discord.js';
import { createEvent } from '../builders/index.js';
import { logger } from '../lib/logger.js';
import { config } from '../config.js';

export default createEvent(Events.ClientReady)
  .setOnce()
  .setExecute(async (client) => {
    logger.success(`Logged in as ${client.user.tag}`);
    logger.info(`Bound to guild: ${config.guildId}`);
    logger.info(`Prefix is set to: ${config.prefix}`);
  });
