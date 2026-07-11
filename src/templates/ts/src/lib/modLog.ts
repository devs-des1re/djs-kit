import type { Client, Guild, GuildTextBasedChannel, User } from 'discord.js';
import { config } from '../config.js';
import { neutralEmbed, warningEmbed, type EmbedOptions } from './embeds.js';
import { logger } from './logger.js';

async function resolveLogChannel(guild: Guild, channelId?: string): Promise<GuildTextBasedChannel | null> {
  if (!channelId) return null;
  const channel = await guild.channels.fetch(channelId).catch(() => null);
  return channel?.isTextBased() ? channel : null;
}

export async function sendLog(
  client: Client,
  options: EmbedOptions & { guildId?: string; channelId?: string }
): Promise<void> {
  const guildId = options.guildId ?? config.guildId;
  const guild = await client.guilds.fetch(guildId).catch(() => null);
  if (!guild) {
    logger.warn(`Could not send log: guild ${guildId} was not found.`);
    return;
  }

  const channel = await resolveLogChannel(guild, options.channelId ?? config.logChannelId);
  if (!channel) return;
  await channel.send({ embeds: [neutralEmbed(options)] }).catch(error => {
    logger.error('Failed to send log message.', error);
  });
}

export interface ModerationAuditOptions {
  guild: Guild;
  action: string;
  moderator: User;
  target?: User;
  reason?: string;
}

export async function sendModerationAudit(options: ModerationAuditOptions): Promise<void> {
  const channel = await resolveLogChannel(options.guild, config.modAuditChannelId ?? config.logChannelId);
  if (!channel) return;

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
