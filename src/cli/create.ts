import { resolve, join } from 'path';
import { access } from 'fs/promises';
import { createFlow } from '../prompts/createFlow.js';
import { generateProject } from '../generators/project.js';
import { log } from '../utils/logger.js';
import type { CreateOptions } from '../types.js';

interface CreateCliOptions {
  lang?: string;
  db?: string;
  guildId?: string;
  prefix?: string;
  bare?: boolean;
  install?: boolean;
}

export async function handleCreate(
  projectName: string,
  options: CreateCliOptions
): Promise<void> {
  let opts: CreateOptions;

  if (!options.lang) {
    // Interactive mode — run full prompt flow
    opts = await createFlow(projectName);
  } else {
    // Non-interactive mode — all required options must be provided
    if (!options.guildId) {
      log.error('--guild-id is required in non-interactive mode (when --lang is specified)');
      process.exit(1);
    }

    const lang = options.lang as 'ts' | 'js';
    if (lang !== 'ts' && lang !== 'js') {
      log.error(`Invalid --lang "${options.lang}". Must be "ts" or "js".`);
      process.exit(1);
    }

    const token = process.env.DISCORD_TOKEN ?? '';
    const clientId = process.env.DISCORD_CLIENT_ID ?? '';

    if (!token) {
      log.warn('No DISCORD_TOKEN environment variable set. Your .env will have an empty token.');
      log.info('Set DISCORD_TOKEN in your environment before running, or run interactively.');
    }

    const db = (options.db ?? 'none') as 'none' | 'mongo';
    if (db !== 'none' && db !== 'mongo') {
      log.error(`Invalid --db "${options.db}". Must be "none" or "mongo".`);
      process.exit(1);
    }

    opts = {
      name: projectName,
      lang,
      db,
      guildId: options.guildId,
      clientId,
      token,
      prefix: options.prefix ?? '!',
      bare: options.bare ?? false,
      install: options.install ?? true,
    };
  }

  await generateProject(opts);
}
