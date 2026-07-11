import { readFile, writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { logger } from './logger.js';
class InMemoryCooldownStore {
    store = new Map();
    key(commandName, userId) {
        return `${commandName}:${userId}`;
    }
    async check(commandName, userId) {
        const expiresAt = this.store.get(this.key(commandName, userId));
        if (!expiresAt)
            return null;
        const now = Date.now();
        if (now > expiresAt) {
            this.store.delete(this.key(commandName, userId));
            return null;
        }
        return expiresAt - now;
    }
    async set(commandName, userId, durationMs) {
        this.store.set(this.key(commandName, userId), Date.now() + durationMs);
    }
}
class FileCooldownStore {
    dataFile = join(process.cwd(), '.djskit-data', 'cooldowns.json');
    store = null;
    saveTimeout = null;
    async load() {
        if (this.store)
            return this.store;
        try {
            const content = await readFile(this.dataFile, 'utf-8');
            this.store = JSON.parse(content);
        }
        catch {
            this.store = {};
        }
        // Cleanup expired
        const now = Date.now();
        let changed = false;
        for (const [k, v] of Object.entries(this.store)) {
            if (now > v) {
                delete this.store[k];
                changed = true;
            }
        }
        if (changed)
            this.scheduleSave();
        return this.store;
    }
    scheduleSave() {
        if (this.saveTimeout)
            clearTimeout(this.saveTimeout);
        this.saveTimeout = setTimeout(async () => {
            try {
                await mkdir(dirname(this.dataFile), { recursive: true });
                await writeFile(this.dataFile, JSON.stringify(this.store || {}), 'utf-8');
            }
            catch (err) {
                logger.error('Failed to save cooldowns.', err);
            }
        }, 1000); // Debounce saves
    }
    async check(commandName, userId) {
        const store = await this.load();
        const key = `${commandName}:${userId}`;
        const expiresAt = store[key];
        if (!expiresAt)
            return null;
        const now = Date.now();
        if (now > expiresAt) {
            delete store[key];
            this.scheduleSave();
            return null;
        }
        return expiresAt - now;
    }
    async set(commandName, userId, durationMs) {
        const store = await this.load();
        const key = `${commandName}:${userId}`;
        store[key] = Date.now() + durationMs;
        this.scheduleSave();
    }
}
async function loadDatabaseCooldownStore() {
    const importer = new Function('path', 'return import(path)');
    const mod = await importer('../db/cooldowns.js');
    return mod.createDatabaseCooldownStore();
}
export async function createCooldownStore(backend) {
    if (backend === 'file')
        return new FileCooldownStore();
    if (backend === 'memory')
        return new InMemoryCooldownStore();
    return loadDatabaseCooldownStore();
}
