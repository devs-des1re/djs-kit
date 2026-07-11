import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, join } from 'path';
import fg from 'fast-glob';
import type { Client } from 'discord.js';
import type { EventDescriptor } from '../builders/index.js';
import { logger } from '../lib/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function loadEvents(client: Client): Promise<void> {
  const FILE_EXT = import.meta.url.endsWith('.ts') ? 'ts' : 'js';
  const baseDir = join(__dirname, '..', 'events');
  const eventFiles = await fg(`**/*.${FILE_EXT}`, {
    cwd: baseDir.replace(/\\/g, '/'),
    absolute: true,
  });

  const counts = new Map<string, number>();

  for (const filePath of eventFiles) {
    const mod = await import(pathToFileURL(filePath).href);
    if (!mod.default || typeof mod.default.build !== 'function') {
      logger.warn(`File ${filePath} does not default export an event builder. Skipping.`);
      continue;
    }

    const desc = mod.default.build() as EventDescriptor;
    if (!desc.name || typeof desc.execute !== 'function') {
      logger.warn(`File ${filePath} exported an incomplete event. Skipping.`);
      continue;
    }

    const eventName = String(desc.name);
    counts.set(eventName, (counts.get(eventName) ?? 0) + 1);

    const listener = async (...args: unknown[]) => {
      try {
        await (desc.execute as (...args: unknown[]) => Promise<void>)(...args);
      } catch (error) {
        logger.error(`Error executing ${eventName} event from ${filePath}.`, error);
      }
    };

    if (desc.once) {
      client.once(desc.name as never, listener as never);
    } else {
      client.on(desc.name as never, listener as never);
    }
  }

  const total = [...counts.values()].reduce((sum, count) => sum + count, 0);
  logger.info(`Loaded ${total} event listener${total === 1 ? '' : 's'}.`);
}
