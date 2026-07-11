import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, join } from 'path';
import fg from 'fast-glob';
import { logger } from '../lib/logger.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
export async function loadAutocompleteHandlers(client) {
    const FILE_EXT = import.meta.url.endsWith('.ts') ? 'ts' : 'js';
    const baseDir = join(__dirname, '..', 'autocomplete');
    const files = await fg(`**/*.${FILE_EXT}`, { cwd: baseDir.replace(/\\/g, '/'), absolute: true });
    for (const filePath of files) {
        const mod = await import(pathToFileURL(filePath).href);
        if (!mod.default || typeof mod.default.build !== 'function') {
            logger.warn(`File ${filePath} does not default export an autocomplete builder. Skipping.`);
            continue;
        }
        const desc = mod.default.build();
        const key = `${desc.commandName}:${desc.optionName}`;
        if (client.autocompleteHandlers.has(key)) {
            throw new Error(`[AutocompleteLoader] Duplicate autocomplete handler "${key}" found in ${filePath}`);
        }
        client.autocompleteHandlers.set(key, desc);
    }
    logger.info(`Loaded ${client.autocompleteHandlers.size} autocomplete handler${client.autocompleteHandlers.size === 1 ? '' : 's'}.`);
}
