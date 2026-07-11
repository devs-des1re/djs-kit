import { cp, readFile, writeFile } from 'fs/promises';
import { basename, join } from 'path';
import fg from 'fast-glob';

/** Recursively copy a directory */
export async function copyDir(src: string, dest: string): Promise<void> {
  await cp(src, dest, {
    recursive: true,
    filter: (source) => {
      const name = basename(source);
      return name !== 'node_modules' && name !== 'dist';
    },
  });
}

/** Replace __DJSKIT_KEY__ tokens in a file */
export async function interpolateFile(
  filePath: string,
  vars: Record<string, string>
): Promise<void> {
  let content = await readFile(filePath, 'utf-8');
  for (const [key, value] of Object.entries(vars)) {
    // Key is like "GUILD_ID" → replace __DJSKIT_GUILD_ID__
    const token = `__DJSKIT_${key.toUpperCase()}__`;
    content = content.replaceAll(token, value);
  }
  await writeFile(filePath, content, 'utf-8');
}

/** Walk a directory and interpolate all files */
export async function interpolateDir(
  dir: string,
  vars: Record<string, string>
): Promise<void> {
  // Use forward slashes for fast-glob patterns (required even on Windows)
  const pattern = '**/*';
  const files = await fg(pattern, {
    cwd: dir.replace(/\\/g, '/'),
    absolute: true,
    onlyFiles: true,
    dot: true,
  });
  await Promise.all(files.map((f) => interpolateFile(f, vars)));
}
