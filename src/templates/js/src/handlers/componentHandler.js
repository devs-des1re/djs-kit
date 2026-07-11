import { Events } from 'discord.js';
import { parseCustomId } from '../lib/customId.js';
import { checkPermissions } from '../lib/permissions.js';
import { SelectType } from '../builders/types.js';
import { logger } from '../lib/logger.js';
async function rejectInvalidState(interaction, parsed) {
    if (parsed.valid)
        return false;
    if (interaction.isRepliable()) {
        await interaction.reply({
            content: parsed.reason ?? 'This component state is invalid.',
            ephemeral: true,
        }).catch(() => { });
    }
    return true;
}
export function registerComponentHandler(client) {
    client.on(Events.InteractionCreate, async (interaction) => {
        if (!interaction.inGuild())
            return;
        try {
            if (interaction.isUserContextMenuCommand() || interaction.isMessageContextMenuCommand()) {
                const desc = client.contextMenus.get(interaction.commandName);
                if (!desc)
                    return;
                const member = await interaction.guild?.members.fetch(interaction.user.id);
                if (member && !checkPermissions(member, desc.permissions).allowed) {
                    await interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
                    return;
                }
                if (desc.execute) {
                    const target = interaction.isUserContextMenuCommand()
                        ? interaction.targetUser
                        : interaction.targetMessage;
                    await desc.execute(interaction, target);
                }
            }
            else if (interaction.isButton()) {
                const { base, params, ...parsed } = parseCustomId(interaction.customId, {
                    userId: interaction.user.id,
                    guildId: interaction.guildId,
                });
                if (await rejectInvalidState(interaction, { base, params, ...parsed }))
                    return;
                const desc = client.buttons.get(base);
                if (!desc)
                    return;
                const member = await interaction.guild?.members.fetch(interaction.user.id);
                if (member && !checkPermissions(member, desc.permissions).allowed) {
                    await interaction.reply({ content: 'You do not have permission to use this button.', ephemeral: true });
                    return;
                }
                const args = {};
                desc.params.forEach((name, i) => { args[name] = params[i] ?? ''; });
                if (desc.execute)
                    await desc.execute(interaction, args);
            }
            else if (interaction.isModalSubmit()) {
                const parsed = parseCustomId(interaction.customId, {
                    userId: interaction.user.id,
                    guildId: interaction.guildId,
                });
                if (await rejectInvalidState(interaction, parsed))
                    return;
                const { base } = parsed;
                const desc = client.modals.get(base);
                if (!desc)
                    return;
                const member = await interaction.guild?.members.fetch(interaction.user.id);
                if (member && !checkPermissions(member, desc.permissions).allowed) {
                    await interaction.reply({ content: 'You do not have permission to use this modal.', ephemeral: true });
                    return;
                }
                const args = {};
                for (const field of desc.fields) {
                    try {
                        const val = interaction.fields.getTextInputValue(field.name);
                        if (field.minLength && val.length < field.minLength)
                            throw new Error();
                        if (field.maxLength && val.length > field.maxLength)
                            throw new Error();
                        args[field.name] = val;
                    }
                    catch {
                        args[field.name] = undefined;
                    }
                }
                if (desc.execute)
                    await desc.execute(interaction, args);
            }
            else if (interaction.isAnySelectMenu()) {
                const { base, params, ...parsed } = parseCustomId(interaction.customId, {
                    userId: interaction.user.id,
                    guildId: interaction.guildId,
                });
                if (await rejectInvalidState(interaction, { base, params, ...parsed }))
                    return;
                const desc = client.selects.get(base);
                if (!desc)
                    return;
                const member = await interaction.guild?.members.fetch(interaction.user.id);
                if (member && !checkPermissions(member, desc.permissions).allowed) {
                    await interaction.reply({ content: 'You do not have permission to use this menu.', ephemeral: true });
                    return;
                }
                let resolvedValues = [];
                if (desc.selectType === SelectType.String && interaction.isStringSelectMenu()) {
                    resolvedValues = interaction.values;
                }
                else if (desc.selectType === SelectType.User && interaction.isUserSelectMenu()) {
                    resolvedValues = await Promise.all(interaction.values.map(id => interaction.guild.members.fetch(id).then(m => m.user)));
                }
                else if (desc.selectType === SelectType.Role && interaction.isRoleSelectMenu()) {
                    resolvedValues = interaction.values.map(id => interaction.guild.roles.cache.get(id));
                }
                else if (desc.selectType === SelectType.Channel && interaction.isChannelSelectMenu()) {
                    resolvedValues = interaction.values.map(id => interaction.guild.channels.cache.get(id));
                }
                else if (desc.selectType === SelectType.Mentionable && interaction.isMentionableSelectMenu()) {
                    resolvedValues = interaction.values;
                }
                if (desc.execute)
                    await desc.execute(interaction, resolvedValues);
            }
        }
        catch (err) {
            const cid = 'customId' in interaction ? interaction.customId : 'unknown';
            logger.error(`Error executing component ${cid}.`, err);
            const msg = { content: 'There was an error while executing this component!', ephemeral: true };
            if (interaction.isRepliable() && (interaction.replied || interaction.deferred))
                await interaction.followUp(msg).catch(() => { });
            else if (interaction.isRepliable())
                await interaction.reply(msg).catch(() => { });
        }
    });
}
