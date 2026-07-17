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

function parseList(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);
}

function parseShardCount(value: string | undefined): 'auto' | number {
  if (!value || value.toLowerCase() === 'auto') return 'auto';
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
  cooldownBackend: '__DJSKIT_COOLDOWN_BACKEND__' as 'memory' | 'file' | 'sqlite' | 'postgres' | 'mysql' | 'mongo' | 'redis',
  commandMode: 'both' as 'slash' | 'prefix' | 'both',
  commandRegistration: 'guild' as 'guild' | 'global' | 'multiGuild',
  componentStateSecret: envResult.data.DJSKIT_COMPONENT_SECRET ?? envResult.data.DISCORD_TOKEN,
  logChannelId: envResult.data.LOG_CHANNEL_ID,
  modAuditChannelId: envResult.data.MOD_AUDIT_CHANNEL_ID,
  totalShards: parseShardCount(envResult.data.DISCORD_TOTAL_SHARDS),
  logLevel: 'info' as 'debug' | 'info' | 'warn' | 'error',
  messages: {
    commandPermissionDenied: "You don't have permission to use this command. ({reason})",
    componentPermissionDenied: 'You do not have permission to use this {component}.',
    commandCooldown: 'Please wait {seconds}s before using this command again.',
    commandNotImplemented: 'Command logic not implemented.',
    commandError: 'There was an error while executing this command!',
    componentInvalidState: '{reason}',
    componentError: 'There was an error while executing this component!',
  },
} as const;

export type AppConfig = typeof config;
