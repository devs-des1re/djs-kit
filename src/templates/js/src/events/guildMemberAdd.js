import { Events } from 'discord.js';
import { createEvent } from '../builders/index.js';
import { logger } from '../lib/logger.js';
export default createEvent(Events.GuildMemberAdd)
    .setExecute(async (member) => {
    logger.info(`${member.user.tag} joined ${member.guild.name}.`);
});
