import { PermissionsBitField } from 'discord.js';
import { config } from '../config.js';
import { safeEphemeral } from './responses.js';
export function guildOnly(interaction) {
    return interaction.inGuild()
        ? { allowed: true }
        : { allowed: false, reason: 'This action can only be used in a server.' };
}
export function ownerOnly(userId) {
    return config.ownerIds.includes(userId)
        ? { allowed: true }
        : { allowed: false, reason: 'Bot owner only.' };
}
export function devGuildOnly(guildId) {
    return guildId && config.devGuildIds.includes(guildId)
        ? { allowed: true }
        : { allowed: false, reason: 'Development server only.' };
}
export function requireUserPermissions(member, permissions) {
    if (!member)
        return { allowed: false, reason: 'Could not resolve your server member record.' };
    const bits = PermissionsBitField.resolve(permissions);
    return member.permissions.has(bits)
        ? { allowed: true }
        : { allowed: false, reason: `Missing user permission: ${new PermissionsBitField(bits).toArray().join(', ')}` };
}
export function requireBotPermissions(member, permissions) {
    if (!member)
        return { allowed: false, reason: 'Could not resolve my server member record.' };
    const bits = PermissionsBitField.resolve(permissions);
    return member.permissions.has(bits)
        ? { allowed: true }
        : { allowed: false, reason: `Missing bot permission: ${new PermissionsBitField(bits).toArray().join(', ')}` };
}
export async function replyIfBlocked(interaction, result) {
    if (result.allowed)
        return false;
    await safeEphemeral(interaction, result.reason);
    return true;
}
