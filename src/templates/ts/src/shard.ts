import 'dotenv/config';
import { ShardingManager } from 'discord.js';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from './config.js';
import { logger, logFilePath } from './lib/logger.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const isTypeScriptRuntime = fileURLToPath(import.meta.url).endsWith('.ts');
const botEntry = join(__dirname, isTypeScriptRuntime ? 'index.ts' : 'index.js');

const manager = new ShardingManager(botEntry, {
  token: config.token,
  totalShards: config.totalShards,
  respawn: true,
});

manager.on('shardCreate', (shard) => {
  logger.info(`Launching shard ${shard.id}.`);

  shard.on('ready', () => {
    logger.success(`Shard ${shard.id} is ready.`);
  });

  shard.on('disconnect', () => {
    logger.warn(`Shard ${shard.id} disconnected.`);
  });

  shard.on('reconnecting', () => {
    logger.warn(`Shard ${shard.id} is reconnecting.`);
  });

  shard.on('death', (process) => {
    const exitCode = 'exitCode' in process ? process.exitCode : undefined;
    logger.error(`Shard ${shard.id} exited with code ${exitCode ?? 'unknown'}.`);
  });

  shard.on('error', (error) => {
    logger.error(`Shard ${shard.id} emitted an error.`, error);
  });
});

try {
  logger.info(`Shard manager starting with totalShards=${String(config.totalShards)}.`);
  logger.info(`Writing logs to ${logFilePath}.`);
  await manager.spawn();
} catch (error) {
  logger.error('Failed to start shard manager.', error);
  process.exit(1);
}
