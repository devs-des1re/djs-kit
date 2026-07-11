import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, } from 'discord.js';
import { buildCustomId, parseCustomId } from './customId.js';
export function createConfirmationRow(id, userId, guildId) {
    return new ActionRowBuilder().addComponents(new ButtonBuilder()
        .setCustomId(buildCustomId('confirm_action', { id, action: 'confirm' }, { expiresIn: 300, userId, guildId: guildId ?? undefined }))
        .setLabel('Confirm')
        .setStyle(ButtonStyle.Danger), new ButtonBuilder()
        .setCustomId(buildCustomId('confirm_action', { id, action: 'cancel' }, { expiresIn: 300, userId, guildId: guildId ?? undefined }))
        .setLabel('Cancel')
        .setStyle(ButtonStyle.Secondary));
}
export async function askForConfirmation(interaction, options) {
    const timeoutMs = options.timeoutMs ?? 30_000;
    const id = `${interaction.id}:${Date.now()}`;
    const payload = {
        content: options.message,
        components: [createConfirmationRow(id, options.userId, options.guildId)],
        ephemeral: true,
        fetchReply: true,
    };
    const reply = interaction.replied || interaction.deferred
        ? await interaction.followUp(payload)
        : await interaction.reply(payload);
    try {
        const button = await reply.awaitMessageComponent({
            componentType: ComponentType.Button,
            time: timeoutMs,
            filter: (component) => {
                if (!component.isButton() || component.user.id !== options.userId)
                    return false;
                const parsed = parseCustomId(component.customId, { userId: component.user.id, guildId: component.guildId });
                return parsed.valid && parsed.base === 'confirm_action' && parsed.params[0] === id;
            },
        });
        const parsed = parseCustomId(button.customId, { userId: button.user.id, guildId: button.guildId });
        const confirmed = parsed.params[1] === 'confirm';
        await button.update({ content: confirmed ? 'Confirmed.' : 'Cancelled.', components: [] });
        return confirmed;
    }
    catch {
        await interaction.editReply({ content: 'Confirmation timed out.', components: [] }).catch(() => { });
        return false;
    }
}
