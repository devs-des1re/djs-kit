import { Events } from 'discord.js';
import { createEvent } from '../builders/index.js';
import { logger } from '../lib/logger.js';

export default createEvent(Events.MessageDelete)
  .setExecute(async (message) => {
    if (!message.guild || message.author?.bot) return;
    logger.info(`Message deleted in #${message.channel.isDMBased() ? 'dm' : message.channel.name}.`);
  });
