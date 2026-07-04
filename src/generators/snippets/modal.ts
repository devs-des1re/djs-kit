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
  return `import { createModal } from '${builders}/index.js';
import { FieldStyle } from '${builders}/types.js';

export default createModal('${customId}')
  // .addField('summary', { style: FieldStyle.Short, minLength: 5, maxLength: 100, required: true })
  // .addField('details', { style: FieldStyle.Paragraph, required: false })
  // .setPermissions({ allowedRoles: [] })
  .setExecute(async (interaction, fields) => {
    // fields.summary, fields.details
    await interaction.reply({ content: 'Form submitted!', ephemeral: true });
  });
`;
}

function jsTemplate(customId: string, nameWithPath: string): string {
  const { builders } = importPaths(nameWithPath);
  return `import { createModal } from '${builders}/index.js';
import { FieldStyle } from '${builders}/types.js';

export default createModal('${customId}')
  .setExecute(async (interaction, fields) => {
    await interaction.reply({ content: 'Form submitted!', ephemeral: true });
  });
`;
}

export async function generateModalSnippet(
  nameWithPath: string,
  lang: Lang,
  projectRoot: string
): Promise<void> {
  const ext = lang === 'ts' ? 'ts' : 'js';
  const modalName = basename(nameWithPath);
  const customId = modalName.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
  const typeDir = join(projectRoot, 'src', 'components', 'modals');
  const targetDir = join(typeDir, dirname(nameWithPath));
  const filePath = join(targetDir, `${modalName}.${ext}`);

  const existing = await fg(`**/${modalName}.${ext}`, {
    cwd: typeDir.replace(/\\/g, '/'),
    absolute: false,
  });
  if (existing.length > 0) {
    log.warn(`A modal named "${modalName}" already exists at: ${existing.join(', ')}`);
    log.warn('Ensure your customId values are unique — the loader validates this at startup.');
  }

  await mkdir(targetDir, { recursive: true });
  const content = lang === 'ts' ? tsTemplate(customId, nameWithPath) : jsTemplate(customId, nameWithPath);
  await writeFile(filePath, content, 'utf-8');
  log.success(`Created modal: src/components/modals/${nameWithPath}.${ext}`);
}
