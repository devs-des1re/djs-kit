import { access, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { log } from '../../utils/logger.js';
import type { Lang } from '../../types.js';

function buildersPath(commandName: string): string {
  const depth = commandName.split('/').length;
  return '../'.repeat(1 + depth) + 'builders';
}

function template(commandName: string, optionName: string): string {
  const bp = buildersPath(commandName);
  const baseCommand = commandName.split('/').at(-1) ?? commandName;
  return `import { createAutocomplete } from '${bp}/index.js';

const choices = ['first', 'second', 'third'];

export default createAutocomplete('${baseCommand}', '${optionName}')
  .setExecute(async (interaction) => {
    const focused = interaction.options.getFocused().toLowerCase();
    await interaction.respond(
      choices
        .filter(choice => choice.includes(focused))
        .map(choice => ({ name: choice, value: choice }))
    );
  });
`;
}

export async function generateAutocompleteSnippet(
  commandName: string,
  optionName: string,
  lang: Lang,
  projectRoot: string
): Promise<void> {
  const ext = lang === 'ts' ? 'ts' : 'js';
  const targetDir = join(projectRoot, 'src', 'autocomplete', commandName);
  const filePath = join(targetDir, `${optionName}.${ext}`);

  let fileExists = false;
  try {
    await access(filePath);
    fileExists = true;
  } catch {
    // File does not exist, which is what we want.
  }
  if (fileExists) {
    log.error(`Refusing to overwrite existing file: src/autocomplete/${commandName}/${optionName}.${ext}`);
    process.exit(1);
  }

  await mkdir(targetDir, { recursive: true });
  await writeFile(filePath, template(commandName, optionName), 'utf-8');
  log.success(`Created autocomplete handler: src/autocomplete/${commandName}/${optionName}.${ext}`);
}
