import { readFile, writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { logger } from './logger.js';

export interface CooldownStore {
  /** Returns remaining cooldown in ms, or null if no active cooldown */
  check(commandName: string, userId: string): Promise<number | null>;
  set(commandName: string, userId: string, durationMs: number): Promise<void>;
}

class InMemoryCooldownStore implements CooldownStore {
  private store = new Map<string, number>();

  private key(commandName: string, userId: string) {
    return `${commandName}:${userId}`;
  }

  async check(commandName: string, userId: string): Promise<number | null> {
    const expiresAt = this.store.get(this.key(commandName, userId));
    if (!expiresAt) return null;
    const now = Date.now();
    if (now > expiresAt) {
      this.store.delete(this.key(commandName, userId));
      return null;
    }
    return expiresAt - now;
  }

  async set(commandName: string, userId: string, durationMs: number): Promise<void> {
    this.store.set(this.key(commandName, userId), Date.now() + durationMs);
  }
}

class FileCooldownStore implements CooldownStore {
  private dataFile = join(process.cwd(), '.djskit-data', 'cooldowns.json');
  private store: Record<string, number> | null = null;
  private saveTimeout: NodeJS.Timeout | null = null;

  private async load(): Promise<Record<string, number>> {
    if (this.store) return this.store;
    try {
      const content = await readFile(this.dataFile, 'utf-8');
      this.store = JSON.parse(content);
    } catch {
      this.store = {};
    }
    // Cleanup expired
    const now = Date.now();
    let changed = false;
    for (const [k, v] of Object.entries(this.store!)) {
      if (now > v) {
        delete this.store![k];
        changed = true;
      }
    }
    if (changed) this.scheduleSave();
    return this.store!;
  }

  private scheduleSave() {
    if (this.saveTimeout) clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(async () => {
      try {
        await mkdir(dirname(this.dataFile), { recursive: true });
        await writeFile(this.dataFile, JSON.stringify(this.store || {}), 'utf-8');
      } catch (err) {
        logger.error('Failed to save cooldowns.', err);
      }
    }, 1000); // Debounce saves
  }

  async check(commandName: string, userId: string): Promise<number | null> {
    const store = await this.load();
    const key = `${commandName}:${userId}`;
    const expiresAt = store[key];
    if (!expiresAt) return null;
    const now = Date.now();
    if (now > expiresAt) {
      delete store[key];
      this.scheduleSave();
      return null;
    }
    return expiresAt - now;
  }

  async set(commandName: string, userId: string, durationMs: number): Promise<void> {
    const store = await this.load();
    const key = `${commandName}:${userId}`;
    store[key] = Date.now() + durationMs;
    this.scheduleSave();
  }
}

type CooldownBackend = 'memory' | 'file' | 'sqlite' | 'postgres' | 'mysql' | 'mongo' | 'redis';

async function loadDatabaseCooldownStore(): Promise<CooldownStore> {
  const importer = new Function('path', 'return import(path)') as (path: string) => Promise<{ createDatabaseCooldownStore: () => CooldownStore | Promise<CooldownStore> }>;
  const mod = await importer('../db/cooldowns.js');
  return mod.createDatabaseCooldownStore();
}

export async function createCooldownStore(backend: CooldownBackend): Promise<CooldownStore> {
  if (backend === 'file') return new FileCooldownStore();
  if (backend === 'memory') return new InMemoryCooldownStore();
  return loadDatabaseCooldownStore();
}
