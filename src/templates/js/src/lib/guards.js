import { PermissionsBitField } from 'discord.js';
import { config } from '../config.js';
import { safeEphemeral } from './responses.js';
import { message as configMessage } from './messages.js';
export function guildOnly(interaction) {
    return interaction.inGuild()
        ? { allowed: true }
        : { allowed: false, reason: configMessage('guardGuildOnly') };
}
export function ownerOnly(userId) {
    return config.ownerIds.includes(userId)
        ? { allowed: true }
        : { allowed: false, reason: configMessage('guardOwnerOnly') };
}
export function devGuildOnly(guildId) {
    return guildId && config.devGuildIds.includes(guildId)
        ? { allowed: true }
        : { allowed: false, reason: configMessage('guardDevGuildOnly') };
}
export function requireUserPermissions(member, permissions) {
    if (!member)
        return { allowed: false, reason: configMessage('guardMemberRecordNotFound') };
    const bits = PermissionsBitField.resolve(permissions);
    return member.permissions.has(bits)
        ? { allowed: true }
        : { allowed: false, reason: configMessage('guardMissingUserPermission', { permissions: new PermissionsBitField(bits).toArray().join(', ') }) };
}
export function requireBotPermissions(member, permissions) {
    if (!member)
        return { allowed: false, reason: configMessage('guardBotRecordNotFound') };
    const bits = PermissionsBitField.resolve(permissions);
    return member.permissions.has(bits)
        ? { allowed: true }
        : { allowed: false, reason: configMessage('guardMissingBotPermission', { permissions: new PermissionsBitField(bits).toArray().join(', ') }) };
}
export async function replyIfBlocked(interaction, result) {
    if (result.allowed)
        return false;
    await safeEphemeral(interaction, result.reason);
    return true;
}
