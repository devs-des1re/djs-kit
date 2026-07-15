import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { generateCommandSnippet } from '../src/generators/snippets/command.js';
import { generateEventSnippet } from '../src/generators/snippets/event.js';
import { generateAutocompleteSnippet } from '../src/generators/snippets/autocomplete.js';
import { generateContextSnippet } from '../src/generators/snippets/context.js';
import { generateModalSnippet } from '../src/generators/snippets/modal.js';

const importRuntimeModule = new Function('specifier', 'return import(specifier)') as (specifier: string) => Promise<any>;

test('command generator refuses to overwrite an exact destination file', async () => {
  const tmp = await mkdtemp(join(tmpdir(), 'djskit-snippet-'));
  await mkdir(join(tmp, 'src', 'commands', 'slash'), { recursive: true });

  const originalExit = process.exit;
  try {
    await generateCommandSnippet('admin/ban', 'slash', 'ts', tmp);
    const filePath = join(tmp, 'src', 'commands', 'slash', 'admin', 'ban.ts');
    const before = await readFile(filePath, 'utf-8');
    assert.match(before, /setCategory\('General'\)/);
    assert.match(before, /setDefaultMemberPermissions/);

    process.exit = ((code?: string | number | null | undefined) => {
      throw new Error(`process.exit:${code}`);
    }) as typeof process.exit;

    await assert.rejects(
      () => generateCommandSnippet('admin/ban', 'slash', 'ts', tmp),
      /process\.exit:1/
    );

    const after = await readFile(filePath, 'utf-8');
    assert.equal(after, before);
  } finally {
    process.exit = originalExit;
    await rm(tmp, { recursive: true, force: true });
  }
});

test('slash subcommands preserve descriptions in built descriptors', async () => {
  const builders = await importRuntimeModule(
    pathToFileURL(join(process.cwd(), 'src', 'templates', 'js', 'src', 'builders', 'index.js')).href
  );

  const command = builders.createSlashCommand('suggestion')
    .setDescription('Suggestion tools')
    .addSubcommand(
      builders.createSlashSubcommand('approve')
        .setDescription('Approves a suggestion.')
    )
    .build();

  assert.equal(command.subcommands[0].name, 'approve');
  assert.equal(command.subcommands[0].description, 'Approves a suggestion.');
});

test('event generator creates typed event listener snippets', async () => {
  const tmp = await mkdtemp(join(tmpdir(), 'djskit-event-'));
  await mkdir(join(tmp, 'src', 'events'), { recursive: true });

  try {
    await generateEventSnippet('guildMemberAdd', 'ts', tmp);
    const eventFile = await readFile(join(tmp, 'src', 'events', 'guildMemberAdd.ts'), 'utf-8');
    assert.match(eventFile, /createEvent\(Events\.GuildMemberAdd\)/);
    assert.match(eventFile, /setExecute/);
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
});

test('advanced interaction generators create autocomplete and context snippets', async () => {
  const tmp = await mkdtemp(join(tmpdir(), 'djskit-advanced-'));

  try {
    await generateAutocompleteSnippet('ping', 'style', 'ts', tmp);
    const autocompleteFile = await readFile(join(tmp, 'src', 'autocomplete', 'ping', 'style.ts'), 'utf-8');
    assert.match(autocompleteFile, /createAutocomplete\('ping', 'style'\)/);

    await generateContextSnippet('inspectUser', 'user', 'ts', tmp);
    const contextFile = await readFile(join(tmp, 'src', 'contexts', 'user', 'inspectUser.ts'), 'utf-8');
    assert.match(contextFile, /createUserContextMenu\('Inspect User'\)/);
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
});

test('modal generator includes components v2 helper examples', async () => {
  const tmp = await mkdtemp(join(tmpdir(), 'djskit-modal-'));

  try {
    await generateModalSnippet('feedback', 'ts', tmp);
    const modalFile = await readFile(join(tmp, 'src', 'components', 'modals', 'feedback.ts'), 'utf-8');
    assert.match(modalFile, /addStringSelect\('topic'/);
    assert.match(modalFile, /addRadioGroup\('priority'/);
    assert.match(modalFile, /addImageUpload\('screenshot'/);
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
});
