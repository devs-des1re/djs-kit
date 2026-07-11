import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { generateCommandSnippet } from '../src/generators/snippets/command.js';
import { generateEventSnippet } from '../src/generators/snippets/event.js';
import { generateAutocompleteSnippet } from '../src/generators/snippets/autocomplete.js';
import { generateContextSnippet } from '../src/generators/snippets/context.js';

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
