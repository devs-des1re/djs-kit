import { writeFile, mkdir } from 'fs/promises';
import { join, dirname, basename } from 'path';
import fg from 'fast-glob';
import { log } from '../../utils/logger.js';
import type { Lang } from '../../types.js';

function importPaths(nameWithPath: string) {
  const depth = nameWithPath.split('/').length - 1;
  const base = '../'.repeat(2 + depth);
  return { builders: base + 'builders' };
}

function tsTemplate(customId: string, nameWithPath: string): string {
  const { builders } = importPaths(nameWithPath);
  return `import { createSelect } from '${builders}/index.js';
import { SelectType } from '${builders}/types.js';

export default createSelect('${customId}', { type: SelectType.String })
  // Change SelectType to: User, Role, Channel, Mentionable, or String
  // .setPermissions({ allowedRoles: [] })
  .setExecute(async (interaction, values) => {
    // values: resolved objects (User[], Role[], etc.) or string[] for String type
    await interaction.reply({ content: \`Selected: \${values.join(', ')}\`, ephemeral: true });
  });
`;
}

function jsTemplate(customId: string, nameWithPath: string): string {
  const { builders } = importPaths(nameWithPath);
  return `import { createSelect } from '${builders}/index.js';
import { SelectType } from '${builders}/types.js';

export default createSelect('${customId}', { type: SelectType.String })
  .setExecute(async (interaction, values) => {
    await interaction.reply({ content: \`Selected: \${values.join(', ')}\`, ephemeral: true });
  });
`;
}

export async function generateSelectSnippet(
  nameWithPath: string,
  lang: Lang,
  projectRoot: string
): Promise<void> {
  const ext = lang === 'ts' ? 'ts' : 'js';
  const selectName = basename(nameWithPath);
  const customId = selectName.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
  const typeDir = join(projectRoot, 'src', 'components', 'selects');
  const targetDir = join(typeDir, dirname(nameWithPath));
  const filePath = join(targetDir, `${selectName}.${ext}`);

  const existing = await fg(`**/${selectName}.${ext}`, {
    cwd: typeDir.replace(/\\/g, '/'),
    absolute: false,
  });
  if (existing.length > 0) {
    log.warn(`A select named "${selectName}" already exists at: ${existing.join(', ')}`);
    log.warn('Ensure your customId values are unique — the loader validates this at startup.');
  }

  await mkdir(targetDir, { recursive: true });
  const content = lang === 'ts' ? tsTemplate(customId, nameWithPath) : jsTemplate(customId, nameWithPath);
  await writeFile(filePath, content, 'utf-8');
  log.success(`Created select: src/components/selects/${nameWithPath}.${ext}`);
}
