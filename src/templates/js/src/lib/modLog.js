import { config } from '../config.js';
import { neutralEmbed, warningEmbed } from './embeds.js';
import { logger } from './logger.js';
async function resolveLogChannel(guild, channelId) {
    if (!channelId)
        return null;
    const channel = await guild.channels.fetch(channelId).catch(() => null);
    return channel?.isTextBased() ? channel : null;
}
export async function sendLog(client, options) {
    const guildId = options.guildId ?? config.guildId;
    const guild = await client.guilds.fetch(guildId).catch(() => null);
    if (!guild) {
        logger.warn(`Could not send log: guild ${guildId} was not found.`);
        return;
    }
    const channel = await resolveLogChannel(guild, options.channelId ?? config.logChannelId);
    if (!channel)
        return;
    await channel.send({ embeds: [neutralEmbed(options)] }).catch(error => {
        logger.error('Failed to send log message.', error);
    });
}
export async function sendModerationAudit(options) {
    const channel = await resolveLogChannel(options.guild, config.modAuditChannelId ?? config.logChannelId);
    if (!channel)
        return;
    await channel.send({
        embeds: [
            warningEmbed({
                title: options.action,
                fields: [
                    { name: 'Moderator', value: `${options.moderator.tag} (${options.moderator.id})`, inline: false },
                    ...(options.target ? [{ name: 'Target', value: `${options.target.tag} (${options.target.id})`, inline: false }] : []),
                    ...(options.reason ? [{ name: 'Reason', value: options.reason, inline: false }] : []),
                ],
            }),
        ],
    }).catch(error => {
        logger.error('Failed to send moderation audit log.', error);
    });
}
