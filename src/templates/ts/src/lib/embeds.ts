import { EmbedBuilder, type APIEmbedField } from 'discord.js';

export const embedColors = {
  info: 0x3b82f6,
  success: 0x22c55e,
  warning: 0xf59e0b,
  error: 0xef4444,
  neutral: 0x64748b,
} as const;

export interface EmbedOptions {
  title?: string;
  description?: string;
  fields?: APIEmbedField[];
  footer?: string;
}

export function createEmbed(color: number, options: EmbedOptions = {}): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setColor(color)
    .setTimestamp();

  if (options.title) embed.setTitle(options.title);
  if (options.description) embed.setDescription(options.description);
  if (options.fields?.length) embed.addFields(options.fields);
  if (options.footer) embed.setFooter({ text: options.footer });

  return embed;
}

export const infoEmbed = (options: EmbedOptions) => createEmbed(embedColors.info, options);
export const successEmbed = (options: EmbedOptions) => createEmbed(embedColors.success, options);
export const warningEmbed = (options: EmbedOptions) => createEmbed(embedColors.warning, options);
export const errorEmbed = (options: EmbedOptions) => createEmbed(embedColors.error, options);
export const neutralEmbed = (options: EmbedOptions) => createEmbed(embedColors.neutral, options);
