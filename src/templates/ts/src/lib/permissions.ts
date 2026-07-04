import type { GuildMember } from 'discord.js';
import type { PermissionConfig } from '../builders/index.js';

export type PermissionCheckResult =
  | { allowed: true }
  | { allowed: false; reason: 'blacklisted_user' | 'blacklisted_role' | 'missing_role_or_user' };

export function checkPermissions(
  member: GuildMember,
  config?: PermissionConfig
): PermissionCheckResult {
  if (!config) return { allowed: true };

  // 1. Blacklisted Users
  if (config.blacklistedUsers?.includes(member.id)) {
    return { allowed: false, reason: 'blacklisted_user' };
  }

  // 2. Blacklisted Roles
  if (config.blacklistedRoles && config.blacklistedRoles.length > 0) {
    const hasBlacklistedRole = config.blacklistedRoles.some(
      (r) => member.roles.cache.has(r) || member.roles.cache.some((mr) => mr.name === r)
    );
    if (hasBlacklistedRole) {
      return { allowed: false, reason: 'blacklisted_role' };
    }
  }

  // 3. Allowed Users/Roles
  const hasAllowedUsers = config.allowedUsers && config.allowedUsers.length > 0;
  const hasAllowedRoles = config.allowedRoles && config.allowedRoles.length > 0;

  if (hasAllowedUsers || hasAllowedRoles) {
    const userAllowed = config.allowedUsers?.includes(member.id) ?? false;
    const roleAllowed =
      config.allowedRoles?.some(
        (r) => member.roles.cache.has(r) || member.roles.cache.some((mr) => mr.name === r)
      ) ?? false;

    if (!userAllowed && !roleAllowed) {
      return { allowed: false, reason: 'missing_role_or_user' };
    }
  }

  return { allowed: true };
}
