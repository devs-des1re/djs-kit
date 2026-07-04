import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, join } from 'path';
import fg from 'fast-glob';
import { logger } from '../lib/logger.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
export async function loadComponents(client) {
    const FILE_EXT = import.meta.url.endsWith('.ts') ? 'ts' : 'js';
    const baseDir = join(__dirname, '..', 'components');
    const buttonFiles = await fg(`buttons/**/*.${FILE_EXT}`, { cwd: baseDir.replace(/\\/g, '/'), absolute: true });
    const modalFiles = await fg(`modals/**/*.${FILE_EXT}`, { cwd: baseDir.replace(/\\/g, '/'), absolute: true });
    const selectFiles = await fg(`selects/**/*.${FILE_EXT}`, { cwd: baseDir.replace(/\\/g, '/'), absolute: true });
    const buttons = new Map();
    const modals = new Map();
    const selects = new Map();
    async function loadFile(filePath, type) {
        const mod = await import(pathToFileURL(filePath).href);
        if (!mod.default || typeof mod.default.build !== 'function') {
            logger.warn(`File ${filePath} does not default export a builder. Skipping.`);
            return;
        }
        const desc = mod.default.build();
        const map = type === 'button' ? buttons : type === 'modal' ? modals : selects;
        if (map.has(desc.customId)) {
            throw new Error(`[ComponentLoader] Duplicate ${type} customId "${desc.customId}" found in ${filePath} and ${map.get(desc.customId)}`);
        }
        map.set(desc.customId, filePath);
        if (type === 'button')
            client.buttons.set(desc.customId, desc);
        else if (type === 'modal')
            client.modals.set(desc.customId, desc);
        else if (type === 'select')
            client.selects.set(desc.customId, desc);
    }
    await Promise.all([
        ...buttonFiles.map(f => loadFile(f, 'button')),
        ...modalFiles.map(f => loadFile(f, 'modal')),
        ...selectFiles.map(f => loadFile(f, 'select'))
    ]);
    logger.info(`Loaded ${buttons.size} buttons, ${modals.size} modals, ${selects.size} selects.`);
}
