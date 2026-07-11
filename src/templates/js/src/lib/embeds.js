import { EmbedBuilder } from 'discord.js';
export const embedColors = {
    info: 0x3b82f6,
    success: 0x22c55e,
    warning: 0xf59e0b,
    error: 0xef4444,
    neutral: 0x64748b,
};
export function createEmbed(color, options = {}) {
    const embed = new EmbedBuilder()
        .setColor(color)
        .setTimestamp();
    if (options.title)
        embed.setTitle(options.title);
    if (options.description)
        embed.setDescription(options.description);
    if (options.fields?.length)
        embed.addFields(options.fields);
    if (options.footer)
        embed.setFooter({ text: options.footer });
    return embed;
}
export const infoEmbed = (options) => createEmbed(embedColors.info, options);
export const successEmbed = (options) => createEmbed(embedColors.success, options);
export const warningEmbed = (options) => createEmbed(embedColors.warning, options);
export const errorEmbed = (options) => createEmbed(embedColors.error, options);
export const neutralEmbed = (options) => createEmbed(embedColors.neutral, options);
