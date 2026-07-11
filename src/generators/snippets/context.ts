import { access, writeFile, mkdir } from 'fs/promises';
import { join, dirname, basename } from 'path';
import { log } from '../../utils/logger.js';
import type { ContextSubtype, Lang } from '../../types.js';

function buildersPath(nameWithPath: string): string {
  const depth = nameWithPath.split('/').length - 1;
  return '../'.repeat(2 + depth) + 'builders';
}

function titleFromName(name: string): string {
  return name
    .replace(/([A-Z])/g, ' $1')
    .replace(/[-_]+/g, ' ')
    .trim()
    .replace(/\b\w/g, char => char.toUpperCase());
}

function template(nameWithPath: string, type: ContextSubtype): string {
  const bp = buildersPath(nameWithPath);
  const name = titleFromName(basename(nameWithPath));
  const factory = type === 'user' ? 'createUserContextMenu' : 'createMessageContextMenu';
  const targetText = type === 'user' ? 'target.toString()' : "target.content || 'No text content'";

  return `import { ${factory} } from '${bp}/index.js';

export default ${factory}('${name}')
  // .setDefaultMemberPermissions('ManageMessages')
  .setExecute(async (interaction, target) => {
    await interaction.reply({ content: String(${targetText}), ephemeral: true });
  });
`;
}

export async function generateContextSnippet(
  nameWithPath: string,
  type: ContextSubtype,
  lang: Lang,
  projectRoot: string
): Promise<void> {
  const ext = lang === 'ts' ? 'ts' : 'js';
  const contextName = basename(nameWithPath);
  const typeDir = join(projectRoot, 'src', 'contexts', type);
  const targetDir = join(typeDir, dirname(nameWithPath));
  const filePath = join(targetDir, `${contextName}.${ext}`);

  let fileExists = false;
  try {
    await access(filePath);
    fileExists = true;
  } catch {
    // File does not exist, which is what we want.
  }
  if (fileExists) {
    log.error(`Refusing to overwrite existing file: src/contexts/${type}/${nameWithPath}.${ext}`);
    process.exit(1);
  }

  await mkdir(targetDir, { recursive: true });
  await writeFile(filePath, template(nameWithPath, type), 'utf-8');
  log.success(`Created ${type} context menu: src/contexts/${type}/${nameWithPath}.${ext}`);
}
