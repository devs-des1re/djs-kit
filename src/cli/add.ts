import { join, dirname, basename } from 'path';
import { access } from 'fs/promises';
import fg from 'fast-glob';
import { findProjectRoot, detectLang } from '../utils/paths.js';
import { generateCommandSnippet } from '../generators/snippets/command.js';
import { generateButtonSnippet } from '../generators/snippets/button.js';
import { generateModalSnippet } from '../generators/snippets/modal.js';
import { generateSelectSnippet } from '../generators/snippets/select.js';
import { log } from '../utils/logger.js';
import type { ComponentType, CommandSubtype } from '../types.js';

interface AddOptions {
  type?: string; // for 'command' type: 'slash' | 'prefix'
}

export async function handleAdd(
  componentType: ComponentType,
  name: string,
  opts: AddOptions
): Promise<void> {
  const projectRoot = await findProjectRoot();
  if (!projectRoot) {
    log.error('Not inside a djskit project. Run this command from your project root (where src/commands/ exists).');
    process.exit(1);
  }

  const lang = await detectLang(projectRoot);

  if (componentType === 'command') {
    const commandSubtype = (opts.type ?? 'slash') as CommandSubtype;
    if (commandSubtype !== 'slash' && commandSubtype !== 'prefix') {
      log.error(`Invalid command type "${opts.type}". Must be "slash" or "prefix".`);
      process.exit(1);
    }
    await generateCommandSnippet(name, commandSubtype, lang, projectRoot);
  } else if (componentType === 'button') {
    await generateButtonSnippet(name, lang, projectRoot);
  } else if (componentType === 'modal') {
    await generateModalSnippet(name, lang, projectRoot);
  } else if (componentType === 'select') {
    await generateSelectSnippet(name, lang, projectRoot);
  }
}
