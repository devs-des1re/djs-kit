import { access, writeFile, mkdir } from 'fs/promises';
import { join, dirname, basename } from 'path';
import { log } from '../../utils/logger.js';
import type { Lang } from '../../types.js';

const eventEnumByName: Record<string, string> = {
  ready: 'ClientReady',
  interactionCreate: 'InteractionCreate',
  guildMemberAdd: 'GuildMemberAdd',
  guildMemberRemove: 'GuildMemberRemove',
  messageCreate: 'MessageCreate',
  messageDelete: 'MessageDelete',
  messageUpdate: 'MessageUpdate',
  channelCreate: 'ChannelCreate',
  channelDelete: 'ChannelDelete',
  guildCreate: 'GuildCreate',
  guildDelete: 'GuildDelete',
  error: 'Error',
  warn: 'Warn',
};

function buildersPath(nameWithPath: string): string {
  const depth = nameWithPath.split('/').length - 1;
  return '../'.repeat(1 + depth) + 'builders';
}

function eventExpression(eventName: string): string {
  const enumName = eventEnumByName[eventName];
  return enumName ? `Events.${enumName}` : `'${eventName}' as any`;
}

function tsTemplate(eventName: string, nameWithPath: string): string {
  const bp = buildersPath(nameWithPath);
  return `import { Events } from 'discord.js';
import { createEvent } from '${bp}/index.js';

export default createEvent(${eventExpression(eventName)})
  // .setOnce()
  .setExecute(async (...args) => {
    // Handle the ${eventName} event here.
  });
`;
}

function jsTemplate(eventName: string, nameWithPath: string): string {
  const bp = buildersPath(nameWithPath);
  return `import { Events } from 'discord.js';
import { createEvent } from '${bp}/index.js';

export default createEvent(${eventExpression(eventName).replace(' as any', '')})
  // .setOnce()
  .setExecute(async (...args) => {
    // Handle the ${eventName} event here.
  });
`;
}

export async function generateEventSnippet(
  nameWithPath: string,
  lang: Lang,
  projectRoot: string
): Promise<void> {
  const ext = lang === 'ts' ? 'ts' : 'js';
  const eventName = basename(nameWithPath);
  const typeDir = join(projectRoot, 'src', 'events');
  const targetDir = join(typeDir, dirname(nameWithPath));
  const filePath = join(targetDir, `${eventName}.${ext}`);

  let fileExists = false;
  try {
    await access(filePath);
    fileExists = true;
  } catch {
    // File does not exist, which is what we want.
  }
  if (fileExists) {
    log.error(`Refusing to overwrite existing file: src/events/${nameWithPath}.${ext}`);
    process.exit(1);
  }

  await mkdir(targetDir, { recursive: true });
  const content = lang === 'ts' ? tsTemplate(eventName, nameWithPath) : jsTemplate(eventName, nameWithPath);
  await writeFile(filePath, content, 'utf-8');
  log.success(`Created event: src/events/${nameWithPath}.${ext}`);
}
