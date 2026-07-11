import { access, writeFile, mkdir } from 'fs/promises';
import { join, dirname, basename } from 'path';
import fg from 'fast-glob';
import { log } from '../../utils/logger.js';
import type { CommandSubtype, Lang } from '../../types.js';

function buildersPath(nameWithPath: string): string {
  const depth = nameWithPath.split('/').length - 1;
  return '../'.repeat(2 + depth) + 'builders';
}

function tsSlashTemplate(commandName: string, nameWithPath: string): string {
  const bp = buildersPath(nameWithPath);
  return `import { createSlashCommand } from '${bp}/index.js';
import { ParamType } from '${bp}/types.js';

export default createSlashCommand('${commandName}')
  .setDescription('A new slash command')
  .setCategory('General')
  .addExample('/${commandName}')
  // .addParam('target', ParamType.User, { required: true, description: 'Target user' })
  // .setPermissions({ allowedRoles: [] })
  // .setDefaultMemberPermissions('ManageMessages')
  // .setOwnerOnly()
  // .setDevOnly()
  // .setCooldown(5)
  .setExecute(async (interaction, args) => {
    await interaction.reply({ content: 'Hello from /${commandName}!', ephemeral: true });
  });
`;
}

function tsPrefixTemplate(commandName: string, nameWithPath: string): string {
  const bp = buildersPath(nameWithPath);
  return `import { createPrefixCommand } from '${bp}/index.js';
import { ParamType } from '${bp}/types.js';

export default createPrefixCommand('${commandName}')
  .setDescription('A new prefix command')
  .setCategory('General')
  .addExample('!${commandName}')
  // .addAlias('${commandName}-alias')
  // .addParam('target', ParamType.User, { required: true })
  // .setPermissions({ allowedRoles: [] })
  // .setOwnerOnly()
  // .setDevOnly()
  // .setCooldown(5)
  .setExecute(async (message, args) => {
    await message.reply('Hello from !${commandName}!');
  });
`;
}

function jsSlashTemplate(commandName: string, nameWithPath: string): string {
  const bp = buildersPath(nameWithPath);
  return `import { createSlashCommand } from '${bp}/index.js';
import { ParamType } from '${bp}/types.js';

export default createSlashCommand('${commandName}')
  .setDescription('A new slash command')
  .setCategory('General')
  .addExample('/${commandName}')
  .setExecute(async (interaction, args) => {
    await interaction.reply({ content: 'Hello from /${commandName}!', ephemeral: true });
  });
`;
}

function jsPrefixTemplate(commandName: string, nameWithPath: string): string {
  const bp = buildersPath(nameWithPath);
  return `import { createPrefixCommand } from '${bp}/index.js';
import { ParamType } from '${bp}/types.js';

export default createPrefixCommand('${commandName}')
  .setDescription('A new prefix command')
  .setCategory('General')
  .addExample('!${commandName}')
  .setExecute(async (message, args) => {
    await message.reply('Hello from !${commandName}!');
  });
`;
}

export async function generateCommandSnippet(
  nameWithPath: string,
  commandSubtype: CommandSubtype,
  lang: Lang,
  projectRoot: string
): Promise<void> {
  const ext = lang === 'ts' ? 'ts' : 'js';
  const commandName = basename(nameWithPath);
  const typeDir = join(projectRoot, 'src', 'commands', commandSubtype);
  const targetDir = join(typeDir, dirname(nameWithPath));
  const filePath = join(targetDir, `${commandName}.${ext}`);

  let fileExists = false;
  try {
    await access(filePath);
    fileExists = true;
  } catch {
    // File does not exist, which is what we want.
  }
  if (fileExists) {
    log.error(`Refusing to overwrite existing file: src/commands/${commandSubtype}/${nameWithPath}.${ext}`);
    process.exit(1);
  }

  // Warn about duplicate base filenames
  const existing = await fg(`**/${commandName}.${ext}`, {
    cwd: typeDir.replace(/\\/g, '/'),
    absolute: false,
  });
  if (existing.length > 0) {
    log.warn(
      `A ${commandSubtype} command with base name "${commandName}" already exists at: ${existing.join(', ')}`
    );
    log.warn('Ensure your .setName() values are unique — the loader validates this at startup.');
  }

  await mkdir(targetDir, { recursive: true });

  let content: string;
  if (lang === 'ts') {
    content = commandSubtype === 'slash'
      ? tsSlashTemplate(commandName, nameWithPath)
      : tsPrefixTemplate(commandName, nameWithPath);
  } else {
    content = commandSubtype === 'slash'
      ? jsSlashTemplate(commandName, nameWithPath)
      : jsPrefixTemplate(commandName, nameWithPath);
  }

  await writeFile(filePath, content, 'utf-8');
  log.success(`Created ${commandSubtype} command: src/commands/${commandSubtype}/${nameWithPath}.${ext}`);
}
