import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, join } from 'path';
import fg from 'fast-glob';
import type { Client } from 'discord.js';
import type { ContextMenuDescriptor } from '../builders/index.js';
import { logger } from '../lib/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function loadContextMenus(client: Client): Promise<void> {
  const FILE_EXT = import.meta.url.endsWith('.ts') ? 'ts' : 'js';
  const baseDir = join(__dirname, '..', 'contexts');
  const userFiles = await fg(`user/**/*.${FILE_EXT}`, { cwd: baseDir.replace(/\\/g, '/'), absolute: true });
  const messageFiles = await fg(`message/**/*.${FILE_EXT}`, { cwd: baseDir.replace(/\\/g, '/'), absolute: true });

  async function loadFile(filePath: string, expectedType: 'user' | 'message') {
    const mod = await import(pathToFileURL(filePath).href);
    if (!mod.default || typeof mod.default.build !== 'function') {
      logger.warn(`File ${filePath} does not default export a context menu builder. Skipping.`);
      return;
    }

    const desc = mod.default.build() as ContextMenuDescriptor;
    if (desc.type !== expectedType) {
      logger.warn(`File ${filePath} exported a ${desc.type} context menu but is in the ${expectedType} folder. Skipping.`);
      return;
    }

    if (client.contextMenus.has(desc.name)) {
      throw new Error(`[ContextLoader] Duplicate context menu "${desc.name}" found in ${filePath}`);
    }
    client.contextMenus.set(desc.name, desc);
  }

  await Promise.all([
    ...userFiles.map(file => loadFile(file, 'user')),
    ...messageFiles.map(file => loadFile(file, 'message')),
  ]);

  logger.info(`Loaded ${client.contextMenus.size} context menu command${client.contextMenus.size === 1 ? '' : 's'}.`);
}
