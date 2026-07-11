import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import { access } from 'fs/promises';
import { existsSync } from 'fs';

/** Absolute path to the djskit package root (where package.json lives) */
export function getPackageRoot(): string {
  const __filename = fileURLToPath(import.meta.url);
  let dir = dirname(__filename);

  while (true) {
    if (existsSync(join(dir, 'package.json')) && existsSync(join(dir, 'src', 'templates'))) {
      return dir;
    }

    const parent = dirname(dir);
    if (parent === dir) {
      throw new Error('Unable to locate djs-kit package root.');
    }
    dir = parent;
  }
}

/** Get the templates directory for the given language */
export function getTemplateDir(lang: 'ts' | 'js'): string {
  return join(getPackageRoot(), 'src', 'templates', lang);
}

/** Detect the project root from CWD (walks up to find package.json) */
export async function findProjectRoot(startDir: string = process.cwd()): Promise<string | null> {
  let dir = resolve(startDir);
  while (true) {
    try {
      await access(join(dir, 'package.json'));
      // Check it's a djskit project by seeing if src/commands exists
      try {
        await access(join(dir, 'src', 'commands'));
        return dir;
      } catch {
        return null; // found package.json but not a djskit project
      }
    } catch {
      const parent = dirname(dir);
      if (parent === dir) return null; // reached filesystem root
      dir = parent;
    }
  }
}

/** Detect language used in a project (ts if tsconfig.json present) */
export async function detectLang(projectRoot: string): Promise<'ts' | 'js'> {
  try {
    await access(join(projectRoot, 'tsconfig.json'));
    return 'ts';
  } catch {
    return 'js';
  }
}
