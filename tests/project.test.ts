import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { generateProject } from '../src/generators/project.js';
import { getRequiredEnv, validateProject } from '../src/cli/projectTools.js';

test('generates env credentials and project behavior config', async () => {
  const tmp = await mkdtemp(join(tmpdir(), 'djskit-project-'));
  const cwd = process.cwd();

  try {
    process.chdir(tmp);
    await generateProject({
      name: 'phase-one-bot',
      lang: 'ts',
      token: 'token-value',
      clientId: '123456789012345678',
      guildId: '234567890123456789',
      db: 'file',
      preset: 'utility',
      prefix: '?',
      install: false,
    });

    const env = await readFile(join(tmp, 'phase-one-bot', '.env'), 'utf-8');
    assert.match(env, /DISCORD_TOKEN=token-value/);
    assert.match(env, /DISCORD_CLIENT_ID=123456789012345678/);
    assert.match(env, /DISCORD_GUILD_ID=234567890123456789/);
    assert.match(env, /DJSKIT_COMPONENT_SECRET=/);
    assert.doesNotMatch(env, /DJSKIT_PREFIX/);
    assert.doesNotMatch(env, /DJSKIT_COOLDOWN_BACKEND/);

    const config = await readFile(join(tmp, 'phase-one-bot', 'src', 'config.ts'), 'utf-8');
    assert.match(config, /from 'zod'/);
    assert.match(config, /envSchema\.safeParse/);
    assert.match(config, /DISCORD_CLIENT_ID: z\.string\(\)/);
    assert.match(config, /DISCORD_GUILD_ID: z\.string\(\).*\.optional\(\)/);
    assert.match(config, /clientId: envResult\.data\.DISCORD_CLIENT_ID/);
    assert.match(config, /guildId: envResult\.data\.DISCORD_GUILD_ID \?\? parseList/);
    assert.match(config, /prefix: '\?'/);
    assert.match(config, /cooldownBackend: 'file'/);
    assert.match(config, /commandMode: 'both'/);
    assert.match(config, /commandRegistration: 'guild'/);
    assert.match(config, /totalShards: parseShardCount/);
    assert.match(config, /componentStateSecret/);
    assert.match(config, /ownerIds: parseList/);
    assert.match(config, /logLevel: 'info'/);

    const runtime = await readFile(join(tmp, 'phase-one-bot', 'src', 'lib', 'runtime.ts'), 'utf-8');
    assert.match(runtime, /unhandledRejection/);
    assert.match(runtime, /uncaughtException/);
    assert.match(runtime, /SIGINT/);
    assert.match(runtime, /SIGTERM/);

    const index = await readFile(join(tmp, 'phase-one-bot', 'src', 'index.ts'), 'utf-8');
    assert.match(index, /loadEvents\(client\)/);
    assert.match(index, /Writing logs to/);

    const shard = await readFile(join(tmp, 'phase-one-bot', 'src', 'shard.ts'), 'utf-8');
    assert.match(shard, /ShardingManager/);
    assert.match(shard, /totalShards: config\.totalShards/);
    assert.match(shard, /respawn: true/);

    const logger = await readFile(join(tmp, 'phase-one-bot', 'src', 'lib', 'logger.ts'), 'utf-8');
    assert.match(logger, /logs/);
    assert.match(logger, /bot-\$\{logStartedAt/);
    assert.match(logger, /appendFileSync/);

    const eventLoader = await readFile(join(tmp, 'phase-one-bot', 'src', 'handlers', 'eventLoader.ts'), 'utf-8');
    assert.match(eventLoader, /join\(__dirname, '\.\.', 'events'\)/);
    assert.match(eventLoader, /client\.once/);
    assert.match(eventLoader, /client\.on/);

    const readyEvent = await readFile(join(tmp, 'phase-one-bot', 'src', 'events', 'ready.ts'), 'utf-8');
    assert.match(readyEvent, /createEvent\(Events\.ClientReady\)/);

    const slashHelp = await readFile(join(tmp, 'phase-one-bot', 'src', 'commands', 'slash', 'help.ts'), 'utf-8');
    assert.match(slashHelp, /slashCommands\.values/);

    const prefixHelp = await readFile(join(tmp, 'phase-one-bot', 'src', 'commands', 'prefix', 'help.ts'), 'utf-8');
    assert.match(prefixHelp, /addAlias\('commands'\)/);

    const autocompleteLoader = await readFile(join(tmp, 'phase-one-bot', 'src', 'handlers', 'autocompleteLoader.ts'), 'utf-8');
    assert.match(autocompleteLoader, /autocompleteHandlers/);

    const contextLoader = await readFile(join(tmp, 'phase-one-bot', 'src', 'handlers', 'contextLoader.ts'), 'utf-8');
    assert.match(contextLoader, /contextMenus/);

    const autocompleteExample = await readFile(join(tmp, 'phase-one-bot', 'src', 'autocomplete', 'ping', 'style.ts'), 'utf-8');
    assert.match(autocompleteExample, /createAutocomplete\('ping', 'style'\)/);

    const userContext = await readFile(join(tmp, 'phase-one-bot', 'src', 'contexts', 'user', 'inspectUser.ts'), 'utf-8');
    assert.match(userContext, /createUserContextMenu/);

    const messageContext = await readFile(join(tmp, 'phase-one-bot', 'src', 'contexts', 'message', 'quoteMessage.ts'), 'utf-8');
    assert.match(messageContext, /createMessageContextMenu/);

    const feedbackModal = await readFile(join(tmp, 'phase-one-bot', 'src', 'components', 'modals', 'feedbackForm.ts'), 'utf-8');
    assert.match(feedbackModal, /addStringSelect\('topic'/);
    assert.match(feedbackModal, /addRadioGroup\('priority'/);
    assert.match(feedbackModal, /addImageUpload\('screenshot'/);

    const customId = await readFile(join(tmp, 'phase-one-bot', 'src', 'lib', 'customId.ts'), 'utf-8');
    assert.match(customId, /createHmac/);
    assert.match(customId, /buildLegacyCustomId/);
    assert.match(customId, /expiresIn/);

    for (const helper of ['responses.ts', 'embeds.ts', 'pagination.ts', 'confirm.ts', 'guards.ts', 'modLog.ts']) {
      await readFile(join(tmp, 'phase-one-bot', 'src', 'lib', helper), 'utf-8');
    }

    const ping = await readFile(join(tmp, 'phase-one-bot', 'src', 'commands', 'slash', 'ping.ts'), 'utf-8');
    assert.match(ping, /infoEmbed/);
    assert.match(ping, /safeEdit/);

    const pkg = JSON.parse(await readFile(join(tmp, 'phase-one-bot', 'package.json'), 'utf-8'));
    assert.equal(pkg.scripts['sync:commands'], 'tsx src/scripts/syncCommands.ts');
    assert.equal(pkg.scripts['dev:shards'], 'nodemon --watch src --ext ts,js,json --exec node --import tsx src/shard.ts');
    assert.equal(pkg.scripts['start:shards'], 'node dist/src/shard.js');

    const syncScript = await readFile(join(tmp, 'phase-one-bot', 'src', 'scripts', 'syncCommands.ts'), 'utf-8');
    assert.match(syncScript, /loadCommands/);

    assert.deepEqual(await getRequiredEnv(join(tmp, 'phase-one-bot')), [
      'DISCORD_TOKEN',
      'DISCORD_CLIENT_ID',
      'DISCORD_GUILD_ID',
    ]);

    const validation = await validateProject(join(tmp, 'phase-one-bot'));
    assert.equal(validation.some(issue => issue.level === 'error'), false);
  } finally {
    process.chdir(cwd);
    await rm(tmp, { recursive: true, force: true });
  }
});

test('accepts multi-guild env as satisfying guild registration config', async () => {
  const tmp = await mkdtemp(join(tmpdir(), 'djskit-multiguild-project-'));
  const cwd = process.cwd();

  try {
    process.chdir(tmp);
    await generateProject({
      name: 'multi-bot',
      lang: 'ts',
      token: 'token-value',
      clientId: '123456789012345678',
      guildId: '234567890123456789',
      db: 'none',
      preset: 'bare',
      prefix: '!',
      install: false,
    });

    await writeFile(join(tmp, 'multi-bot', '.env'), [
      'DISCORD_TOKEN=token-value',
      'DISCORD_CLIENT_ID=123456789012345678',
      'DISCORD_GUILD_IDS=234567890123456789,345678901234567890',
      '',
    ].join('\n'));

    const validation = await validateProject(join(tmp, 'multi-bot'));
    assert.equal(validation.some(issue => issue.message.includes('DISCORD_GUILD_ID')), false);
  } finally {
    process.chdir(cwd);
    await rm(tmp, { recursive: true, force: true });
  }
});

test('generates a JavaScript project with synced runtime features', async () => {
  const tmp = await mkdtemp(join(tmpdir(), 'djskit-js-project-'));
  const cwd = process.cwd();

  try {
    process.chdir(tmp);
    await generateProject({
      name: 'js-bot',
      lang: 'js',
      token: 'token-value',
      clientId: '123456789012345678',
      guildId: '234567890123456789',
      db: 'redis',
      preset: 'community',
      prefix: '!',
      install: false,
    });

    const config = await readFile(join(tmp, 'js-bot', 'src', 'config.js'), 'utf-8');
    assert.match(config, /DISCORD_GUILD_ID.*optional/);
    assert.match(config, /cooldownBackend: 'redis'/);
    assert.match(config, /totalShards: parseShardCount/);

    const pkg = JSON.parse(await readFile(join(tmp, 'js-bot', 'package.json'), 'utf-8'));
    assert.equal(pkg.dependencies['discord.js'], '^14.26.4');
    assert.equal(pkg.scripts['start:shards'], 'node src/shard.js');

    const shard = await readFile(join(tmp, 'js-bot', 'src', 'shard.js'), 'utf-8');
    assert.match(shard, /ShardingManager/);
    assert.match(shard, /totalShards: config\.totalShards/);

    const readyEvent = await readFile(join(tmp, 'js-bot', 'src', 'events', 'ready.js'), 'utf-8');
    assert.match(readyEvent, /createEvent\(Events\.ClientReady\)/);

    const serverCommand = await readFile(join(tmp, 'js-bot', 'src', 'commands', 'slash', 'server.js'), 'utf-8');
    assert.match(serverCommand, /createSlashCommand\('server'\)/);

    const cooldowns = await readFile(join(tmp, 'js-bot', 'src', 'db', 'cooldowns.js'), 'utf-8');
    assert.match(cooldowns, /ioredis/);
  } finally {
    process.chdir(cwd);
    await rm(tmp, { recursive: true, force: true });
  }
});

test('generates postgres drizzle database preset files and dependencies', async () => {
  const tmp = await mkdtemp(join(tmpdir(), 'djskit-db-project-'));
  const cwd = process.cwd();

  try {
    process.chdir(tmp);
    await generateProject({
      name: 'postgres-bot',
      lang: 'ts',
      token: 'token-value',
      clientId: '123456789012345678',
      guildId: '234567890123456789',
      db: 'postgres',
      preset: 'utility',
      prefix: '!',
      install: false,
    });

    const env = await readFile(join(tmp, 'postgres-bot', '.env'), 'utf-8');
    assert.match(env, /DATABASE_URL=postgres:\/\/user:password@localhost:5432\/my_bot/);

    const config = await readFile(join(tmp, 'postgres-bot', 'src', 'config.ts'), 'utf-8');
    assert.match(config, /cooldownBackend: 'postgres'/);

    const pkg = JSON.parse(await readFile(join(tmp, 'postgres-bot', 'package.json'), 'utf-8'));
    assert.equal(pkg.dependencies['drizzle-orm'], '^0.36.0');
    assert.equal(pkg.dependencies.postgres, '^3.4.5');
    assert.equal(pkg.devDependencies['drizzle-kit'], '^0.28.0');
    assert.equal(pkg.scripts['db:generate'], 'drizzle-kit generate');

    const schema = await readFile(join(tmp, 'postgres-bot', 'src', 'db', 'schema.ts'), 'utf-8');
    assert.match(schema, /pgTable\('cooldowns'/);

    const adapter = await readFile(join(tmp, 'postgres-bot', 'src', 'db', 'cooldowns.ts'), 'utf-8');
    assert.match(adapter, /createDatabaseCooldownStore/);

    const drizzle = await readFile(join(tmp, 'postgres-bot', 'drizzle.config.ts'), 'utf-8');
    assert.match(drizzle, /dialect: 'postgresql'/);
  } finally {
    process.chdir(cwd);
    await rm(tmp, { recursive: true, force: true });
  }
});

test('generates ticket preset feature files', async () => {
  const tmp = await mkdtemp(join(tmpdir(), 'djskit-preset-project-'));
  const cwd = process.cwd();

  try {
    process.chdir(tmp);
    await generateProject({
      name: 'ticket-bot',
      lang: 'ts',
      token: 'token-value',
      clientId: '123456789012345678',
      guildId: '234567890123456789',
      db: 'none',
      preset: 'tickets',
      prefix: '!',
      install: false,
    });

    const ticketCommand = await readFile(join(tmp, 'ticket-bot', 'src', 'commands', 'slash', 'ticket.ts'), 'utf-8');
    assert.match(ticketCommand, /createSlashCommand\('ticket'\)/);
    assert.match(ticketCommand, /open_ticket/);

    const openButton = await readFile(join(tmp, 'ticket-bot', 'src', 'components', 'buttons', 'openTicket.ts'), 'utf-8');
    assert.match(openButton, /createButton\('open_ticket'\)/);

    const modal = await readFile(join(tmp, 'ticket-bot', 'src', 'components', 'modals', 'ticketReason.ts'), 'utf-8');
    assert.match(modal, /createModal\('ticket_reason'\)/);
  } finally {
    process.chdir(cwd);
    await rm(tmp, { recursive: true, force: true });
  }
});
