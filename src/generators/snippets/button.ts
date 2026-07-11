import { access, writeFile, mkdir } from 'fs/promises';
import { join, dirname, basename } from 'path';
import fg from 'fast-glob';
import { log } from '../../utils/logger.js';
import type { Lang } from '../../types.js';

function importPaths(nameWithPath: string) {
  const depth = nameWithPath.split('/').length - 1;
  const base = '../'.repeat(2 + depth);
  return { builders: base + 'builders', lib: base + 'lib' };
}

function tsTemplate(customId: string, nameWithPath: string): string {
  const { builders, lib } = importPaths(nameWithPath);
  const varName = basename(nameWithPath);
  return `import { createButton } from '${builders}/index.js';
import { buildCustomId } from '${lib}/customId.js';

// Usage elsewhere:
// new ButtonBuilder().setCustomId(buildCustomId('${customId}', { userId: interaction.user.id }, {
//   expiresIn: 300,
//   userId: interaction.user.id,
//   guildId: interaction.guildId ?? undefined,
// }))
export default createButton('${customId}')
  // .addParam('userId')
  // .addParam('itemId')
  // .setPermissions({ allowedRoles: [] })
  .setExecute(async (interaction, args) => {
    // args.userId, args.itemId are available if you called .addParam()
    await interaction.reply({ content: 'Button clicked!', ephemeral: true });
  });
`;
}

function jsTemplate(customId: string, nameWithPath: string): string {
  const { builders, lib } = importPaths(nameWithPath);
  return `import { createButton } from '${builders}/index.js';
import { buildCustomId } from '${lib}/customId.js';

// Usage elsewhere: buildCustomId('${customId}', {}, { expiresIn: 300 })
export default createButton('${customId}')
  .setExecute(async (interaction, args) => {
    await interaction.reply({ content: 'Button clicked!', ephemeral: true });
  });
`;
}

export async function generateButtonSnippet(
  nameWithPath: string,
  lang: Lang,
  projectRoot: string
): Promise<void> {
  const ext = lang === 'ts' ? 'ts' : 'js';
  const buttonName = basename(nameWithPath);
  // Convert camelCase or path name to snake_case for customId
  const customId = buttonName.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
  const typeDir = join(projectRoot, 'src', 'components', 'buttons');
  const targetDir = join(typeDir, dirname(nameWithPath));
  const filePath = join(targetDir, `${buttonName}.${ext}`);

  let fileExists = false;
  try {
    await access(filePath);
    fileExists = true;
  } catch {
    // File does not exist, which is what we want.
  }
  if (fileExists) {
    log.error(`Refusing to overwrite existing file: src/components/buttons/${nameWithPath}.${ext}`);
    process.exit(1);
  }

  const existing = await fg(`**/${buttonName}.${ext}`, {
    cwd: typeDir.replace(/\\/g, '/'),
    absolute: false,
  });
  if (existing.length > 0) {
    log.warn(`A button named "${buttonName}" already exists at: ${existing.join(', ')}`);
    log.warn('Ensure .setCustomId() base values are unique — the loader validates this at startup.');
  }

  await mkdir(targetDir, { recursive: true });
  const content = lang === 'ts' ? tsTemplate(customId, nameWithPath) : jsTemplate(customId, nameWithPath);
  await writeFile(filePath, content, 'utf-8');
  log.success(`Created button: src/components/buttons/${nameWithPath}.${ext}`);
}
