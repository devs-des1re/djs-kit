import { Events } from 'discord.js';
import { config } from '../config.js';
import { checkPermissions } from '../lib/permissions.js';
import { createCooldownStore } from '../lib/cooldowns.js';
import { parseArgs } from '../lib/argParser.js';
import { logger } from '../lib/logger.js';
import { message as configMessage } from '../lib/messages.js';
const cooldowns = await createCooldownStore(config.cooldownBackend);
function checkCommandAccess(userId, guildId, permissions = {}) {
    const perms = permissions;
    if (perms.ownerOnly && !config.ownerIds.includes(userId)) {
        return { allowed: false, reason: 'Bot owner only' };
    }
    if (perms.devOnly && guildId && !config.devGuildIds.includes(guildId)) {
        return { allowed: false, reason: 'Development server only' };
    }
    return { allowed: true, reason: null };
}
export function registerCommandHandler(client) {
    client.on(Events.InteractionCreate, async (interaction) => {
        if (!interaction.isAutocomplete())
            return;
        const focused = interaction.options.getFocused(true);
        const handler = client.autocompleteHandlers.get(`${interaction.commandName}:${focused.name}`);
        if (!handler?.execute)
            return;
        try {
            await handler.execute(interaction);
        }
        catch (err) {
            logger.error(`Error executing autocomplete for ${interaction.commandName}:${focused.name}.`, err);
        }
    });
    // --- SLASH COMMANDS ---
    if (config.commandMode !== 'prefix')
        client.on(Events.InteractionCreate, async (interaction) => {
            if (!interaction.isChatInputCommand())
                return;
            if (!interaction.inGuild())
                return;
            const parentDesc = client.slashCommands.get(interaction.commandName);
            if (!parentDesc)
                return;
            try {
                const subcommandName = parentDesc.subcommands.length > 0
                    ? interaction.options.getSubcommand(false)
                    : null;
                const subcommandDesc = subcommandName
                    ? parentDesc.subcommands.find(sub => sub.name === subcommandName)
                    : null;
                const desc = subcommandDesc
                    ? {
                        ...parentDesc,
                        ...subcommandDesc,
                        name: parentDesc.name,
                        permissions: subcommandDesc.permissions ?? parentDesc.permissions,
                        cooldown: subcommandDesc.cooldown ?? parentDesc.cooldown,
                    }
                    : parentDesc;
                const member = await interaction.guild?.members.fetch(interaction.user.id);
                const accessCheck = checkCommandAccess(interaction.user.id, interaction.guildId, desc.permissions);
                if (!accessCheck.allowed) {
                    await interaction.reply({ content: configMessage('commandPermissionDenied', { reason: accessCheck.reason }), ephemeral: true });
                    return;
                }
                if (member) {
                    const permCheck = checkPermissions(member, desc.permissions);
                    if (!permCheck.allowed) {
                        await interaction.reply({ content: configMessage('commandPermissionDenied', { reason: permCheck.reason }), ephemeral: true });
                        return;
                    }
                }
                if (desc.cooldown) {
                    const cooldownKey = subcommandName ? `${parentDesc.name}.${subcommandName}` : parentDesc.name;
                    const msLeft = await cooldowns.check(cooldownKey, interaction.user.id);
                    if (msLeft) {
                        await interaction.reply({ content: configMessage('commandCooldown', { seconds: (msLeft / 1000).toFixed(1) }), ephemeral: true });
                        return;
                    }
                    await cooldowns.set(cooldownKey, interaction.user.id, desc.cooldown * 1000);
                }
                const args = {};
                for (const param of desc.params) {
                    let val = null;
                    if (param.type === 'string')
                        val = interaction.options.getString(param.name);
                    else if (param.type === 'number')
                        val = interaction.options.getNumber(param.name);
                    else if (param.type === 'boolean')
                        val = interaction.options.getBoolean(param.name);
                    else if (param.type === 'user')
                        val = interaction.options.getUser(param.name);
                    else if (param.type === 'member')
                        val = interaction.options.getMember(param.name);
                    else if (param.type === 'channel' || param.type === 'textChannel') {
                        const ch = interaction.options.getChannel(param.name);
                        val = ch ? (interaction.guild?.channels.cache.get(ch.id) ?? ch) : null;
                    }
                    else if (param.type === 'role')
                        val = interaction.options.getRole(param.name);
                    args[param.name] = val;
                }
                if (desc.execute) {
                    await desc.execute(interaction, args);
                }
                else {
                    await interaction.reply({ content: configMessage('commandNotImplemented'), ephemeral: true });
                }
            }
            catch (err) {
                logger.error(`Error executing slash command ${parentDesc.name}.`, err);
                const msg = { content: configMessage('commandError'), ephemeral: true };
                if (interaction.replied || interaction.deferred)
                    await interaction.followUp(msg).catch(() => { });
                else
                    await interaction.reply(msg).catch(() => { });
            }
        });
    // --- PREFIX COMMANDS ---
    if (config.commandMode !== 'slash')
        client.on(Events.MessageCreate, async (message) => {
            if (message.author.bot || !message.guild)
                return;
            if (!message.content.startsWith(config.prefix))
                return;
            const args = message.content.slice(config.prefix.length).trim().split(/ +/);
            const commandName = args.shift()?.toLowerCase();
            if (!commandName)
                return;
            const parentDesc = client.prefixCommands.get(commandName);
            if (!parentDesc)
                return;
            try {
                let desc = parentDesc;
                let usedSubcommand = false;
                let usedSubcommandName = null;
                if (parentDesc.subcommands.length > 0 && args.length > 0) {
                    const subName = args[0].toLowerCase();
                    const sub = parentDesc.subcommands.find(s => s.name === subName);
                    if (sub) {
                        desc = { ...parentDesc, ...sub, name: parentDesc.name, permissions: sub.permissions ?? parentDesc.permissions, cooldown: sub.cooldown ?? parentDesc.cooldown };
                        args.shift(); // remove subcommand name
                        usedSubcommand = true;
                        usedSubcommandName = sub.name;
                    }
                }
                const accessCheck = checkCommandAccess(message.author.id, message.guildId, desc.permissions);
                if (!accessCheck.allowed) {
                    await message.reply(configMessage('commandPermissionDenied', { reason: accessCheck.reason }));
                    return;
                }
                const permCheck = checkPermissions(message.member, desc.permissions);
                if (!permCheck.allowed) {
                    await message.reply(configMessage('commandPermissionDenied', { reason: permCheck.reason }));
                    return;
                }
                if (desc.cooldown) {
                    const key = usedSubcommandName ? `${parentDesc.name}.${usedSubcommandName}` : parentDesc.name;
                    const msLeft = await cooldowns.check(key, message.author.id);
                    if (msLeft) {
                        await message.reply(configMessage('commandCooldown', { seconds: (msLeft / 1000).toFixed(1) }));
                        return;
                    }
                    await cooldowns.set(key, message.author.id, desc.cooldown * 1000);
                }
                const consumedTokens = usedSubcommand ? 2 : 1;
                const resolvedArgs = await parseArgs(message, args, desc.params, message.guild, consumedTokens);
                if (!resolvedArgs)
                    return; // Error handled inside parseArgs
                if (desc.execute) {
                    await desc.execute(message, resolvedArgs);
                }
                else {
                    await message.reply(configMessage('commandNotImplemented'));
                }
            }
            catch (err) {
                logger.error(`Error executing prefix command ${parentDesc.name}.`, err);
                await message.reply(configMessage('commandError')).catch(() => { });
            }
        });
}
