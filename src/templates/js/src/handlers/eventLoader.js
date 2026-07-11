import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, join } from 'path';
import fg from 'fast-glob';
import { logger } from '../lib/logger.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
export async function loadEvents(client) {
    const FILE_EXT = import.meta.url.endsWith('.ts') ? 'ts' : 'js';
    const baseDir = join(__dirname, '..', 'events');
    const eventFiles = await fg(`**/*.${FILE_EXT}`, {
        cwd: baseDir.replace(/\\/g, '/'),
        absolute: true,
    });
    const counts = new Map();
    for (const filePath of eventFiles) {
        const mod = await import(pathToFileURL(filePath).href);
        if (!mod.default || typeof mod.default.build !== 'function') {
            logger.warn(`File ${filePath} does not default export an event builder. Skipping.`);
            continue;
        }
        const desc = mod.default.build();
        if (!desc.name || typeof desc.execute !== 'function') {
            logger.warn(`File ${filePath} exported an incomplete event. Skipping.`);
            continue;
        }
        const eventName = String(desc.name);
        counts.set(eventName, (counts.get(eventName) ?? 0) + 1);
        const listener = async (...args) => {
            try {
                await desc.execute(...args);
            }
            catch (error) {
                logger.error(`Error executing ${eventName} event from ${filePath}.`, error);
            }
        };
        if (desc.once) {
            client.once(desc.name, listener);
        }
        else {
            client.on(desc.name, listener);
        }
    }
    const total = [...counts.values()].reduce((sum, count) => sum + count, 0);
    logger.info(`Loaded ${total} event listener${total === 1 ? '' : 's'}.`);
}
