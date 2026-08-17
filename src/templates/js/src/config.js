import { z } from 'zod';
const envSchema = z.object({
    DISCORD_TOKEN: z.string().min(1, 'DISCORD_TOKEN is required. Add it to your .env file.'),
    DISCORD_CLIENT_ID: z.string().regex(/^\d{17,19}$/, 'DISCORD_CLIENT_ID must be a Discord snowflake.'),
    DISCORD_GUILD_ID: z.string().regex(/^\d{17,19}$/, 'DISCORD_GUILD_ID must be a Discord snowflake.').optional(),
    DISCORD_GUILD_IDS: z.string().optional(),
    BOT_OWNER_IDS: z.string().optional(),
    DJSKIT_COMPONENT_SECRET: z.string().optional(),
    LOG_CHANNEL_ID: z.string().optional(),
    MOD_AUDIT_CHANNEL_ID: z.string().optional(),
    DISCORD_TOTAL_SHARDS: z.string().optional(),
});
const envResult = envSchema.safeParse(process.env);
if (!envResult.success) {
    console.error('[Config] Invalid environment configuration:');
    for (const issue of envResult.error.issues) {
        console.error(`  - ${issue.message}`);
    }
    process.exit(1);
}
function parseList(value) {
    if (!value)
        return [];
    return value
        .split(',')
        .map(item => item.trim())
        .filter(Boolean);
}
function parseShardCount(value) {
    if (!value || value.toLowerCase() === 'auto')
        return 'auto';
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 1) {
        console.error('[Config] DISCORD_TOTAL_SHARDS must be "auto" or a positive integer.');
        process.exit(1);
    }
    return parsed;
}
export const config = {
    token: envResult.data.DISCORD_TOKEN,
    clientId: envResult.data.DISCORD_CLIENT_ID,
    guildId: envResult.data.DISCORD_GUILD_ID ?? parseList(envResult.data.DISCORD_GUILD_IDS)[0] ?? '',
    guildIds: parseList(envResult.data.DISCORD_GUILD_IDS ?? envResult.data.DISCORD_GUILD_ID),
    ownerIds: parseList(envResult.data.BOT_OWNER_IDS),
    devGuildIds: parseList(envResult.data.DISCORD_GUILD_ID),
    prefix: '__DJSKIT_PREFIX__',
    cooldownBackend: '__DJSKIT_COOLDOWN_BACKEND__',
    commandMode: 'both',
    commandRegistration: 'guild',
    componentStateSecret: envResult.data.DJSKIT_COMPONENT_SECRET ?? envResult.data.DISCORD_TOKEN,
    logChannelId: envResult.data.LOG_CHANNEL_ID,
    modAuditChannelId: envResult.data.MOD_AUDIT_CHANNEL_ID,
    totalShards: parseShardCount(envResult.data.DISCORD_TOTAL_SHARDS),
    logLevel: 'info',
    messages: {
        commandPermissionDenied: "You don't have permission to use this command. ({reason})",
        componentPermissionDenied: 'You do not have permission to use this {component}.',
        commandCooldown: 'Please wait {seconds}s before using this command again.',
        commandNotImplemented: 'Command logic not implemented.',
        commandError: 'There was an error while executing this command!',
        componentInvalidState: '{reason}',
        componentInvalidStateFallback: 'This component state is invalid.',
        componentError: 'There was an error while executing this component!',
        missingRequiredArgument: 'Missing required argument: `{name}` ({meta})',
        invalidChoice: 'Invalid choice for `{name}`. Must be one of: {choices}',
        invalidNumber: 'Invalid number for `{name}`.',
        invalidBoolean: 'Invalid boolean for `{name}`.',
        userNotFound: 'Could not find user/member for `{name}`.',
        channelNotFound: 'Could not find channel for `{name}`.',
        channelMustBeText: 'Channel `{name}` must be a text channel.',
        roleNotFound: 'Could not find role for `{name}`.',
        failedToParseArgument: 'Failed to parse required argument `{name}`.',
        confirmationConfirmed: 'Confirmed.',
        confirmationCancelled: 'Cancelled.',
        confirmationTimedOut: 'Confirmation timed out.',
        guardGuildOnly: 'This action can only be used in a server.',
        guardOwnerOnly: 'Bot owner only.',
        guardDevGuildOnly: 'Development server only.',
        guardMemberRecordNotFound: 'Could not resolve your server member record.',
        guardBotRecordNotFound: 'Could not resolve my server member record.',
        guardMissingUserPermission: 'Missing user permission: {permissions}',
        guardMissingBotPermission: 'Missing bot permission: {permissions}',
        paginationNoPages: 'No pages to show.',
    },
};
