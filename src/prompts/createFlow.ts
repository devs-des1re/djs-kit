import {
  intro,
  outro,
  text,
  select,
  group,
  spinner,
  cancel,
  isCancel,
} from '@clack/prompts';
import pc from 'picocolors';
import { validateToken } from '../utils/discord.js';
import { isValidSnowflake, isValidPrefix, isValidNpmName } from '../utils/validate.js';
import { log } from '../utils/logger.js';
import type { CreateOptions } from '../types.js';

export async function createFlow(projectName: string): Promise<CreateOptions> {
  intro(pc.bold(pc.cyan('djs-kit')) + pc.dim(' — discord.js bot scaffolder'));

  const answers = await group(
    {
      lang: () =>
        select({
          message: 'Output language?',
          options: [
            { value: 'ts', label: 'TypeScript', hint: 'compiled, fully typed' },
            { value: 'js', label: 'JavaScript', hint: 'runs directly, no build step' },
          ],
        }),

      token: () =>
        text({
          message: 'Bot token?',
          placeholder: 'paste your Discord bot token here',
          validate: (v) => (!v || v.trim().length === 0 ? 'Token is required' : undefined),
        }),

      clientId: () =>
        text({
          message: 'Client ID (application ID)?',
          placeholder: '123456789012345678',
          validate: (v) =>
            !v || !isValidSnowflake(v)
              ? 'Must be a valid Discord snowflake (17-19 digit number)'
              : undefined,
        }),

      guildId: () =>
        text({
          message: 'Guild ID (your server)?',
          placeholder: '123456789012345678',
          validate: (v) =>
            !v || !isValidSnowflake(v)
              ? 'Must be a valid Discord snowflake (17-19 digit number)'
              : undefined,
        }),

      db: () =>
        select({
          message: 'Database backend?',
          options: [
            { value: 'none', label: 'None', hint: 'in-memory/file cooldowns only' },
            { value: 'mongo', label: 'MongoDB', hint: 'persistent cooldowns & data' },
          ],
        }),

      prefix: () =>
        text({
          message: 'Command prefix?',
          initialValue: '!',
          validate: (v) =>
            !v || !isValidPrefix(v) ? 'Prefix must be between 1 and 4 characters' : undefined,
        }),

      bare: () =>
        select({
          message: 'Scaffold example commands and components?',
          options: [
            { value: false, label: 'Yes', hint: 'Includes example ping command, buttons, etc.' },
            { value: true, label: 'No', hint: 'Empty project (bare mode)' },
          ],
        }),
    },
    {
      onCancel: () => {
        cancel('Scaffolding cancelled.');
        process.exit(0);
      },
    }
  );

  // Validate token against Discord API
  const s = spinner();
  s.start('Validating Discord token...');
  const validation = await validateToken(answers.token as string);

  if (!validation.valid) {
    s.stop(pc.red('Token validation failed'));
    log.error(`Invalid token: ${validation.error}`);
    log.info('Make sure you copied the full token from the Discord Developer Portal.');
    process.exit(1);
  }

  s.stop(pc.green(`Validated — logged in as ${pc.bold(validation.username)}`));

  outro(pc.green('Options collected — scaffolding your bot!'));

  return {
    name: projectName,
    lang: answers.lang as 'ts' | 'js',
    token: answers.token as string,
    clientId: answers.clientId as string,
    guildId: answers.guildId as string,
    db: answers.db as 'none' | 'mongo',
    prefix: answers.prefix as string,
    bare: answers.bare as boolean,
    install: true,
  };
}
