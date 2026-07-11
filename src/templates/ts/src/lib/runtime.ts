import { Events, type Client } from 'discord.js';
import { logger } from './logger.js';

let shuttingDown = false;

export function registerRuntimeHandlers(client: Client): void {
  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled promise rejection.', reason);
  });

  process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception.', error);
    client.destroy();
    process.exit(1);
  });

  client.on(Events.Error, (error) => {
    logger.error('Discord client error.', error);
  });

  client.on(Events.Warn, (message) => {
    logger.warn(`Discord warning: ${message}`);
  });

  client.on(Events.Debug, (message) => {
    logger.debug(`Discord debug: ${message}`);
  });

  client.on(Events.ShardError, (error, shardId) => {
    logger.error(`Shard ${shardId} error.`, error);
  });

  client.rest.on('rateLimited', (info) => {
    logger.warn(`Discord REST rate limit hit: ${JSON.stringify(info)}`);
  });

  const shutdown = async (signal: NodeJS.Signals) => {
    if (shuttingDown) return;
    shuttingDown = true;

    logger.warn(`Received ${signal}. Shutting down...`);
    try {
      client.destroy();
      logger.success('Discord client destroyed. Goodbye.');
      process.exit(0);
    } catch (error) {
      logger.error('Failed during shutdown.', error);
      process.exit(1);
    }
  };

  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
}
