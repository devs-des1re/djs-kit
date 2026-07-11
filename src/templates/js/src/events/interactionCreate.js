import { Events } from 'discord.js';
import { createEvent } from '../builders/index.js';
import { logger } from '../lib/logger.js';
export default createEvent(Events.InteractionCreate)
    .setExecute(async (interaction) => {
    if (!interaction.isRepliable())
        return;
    logger.debug(`Interaction received: ${interaction.type}`);
});
