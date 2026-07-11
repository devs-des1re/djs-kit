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
    logLevel: 'info',
};
