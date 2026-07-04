import { resolve, join } from 'path';
import { mkdir, access, writeFile, rm } from 'fs/promises';
import { execSync } from 'child_process';
import pc from 'picocolors';
import { copyDir, interpolateDir } from '../utils/fs.js';
import { getTemplateDir } from '../utils/paths.js';
import { log } from '../utils/logger.js';
import type { CreateOptions } from '../types.js';

export async function generateProject(opts: CreateOptions): Promise<void> {
  const targetDir = resolve(process.cwd(), opts.name);

  // Check if target directory already exists
  try {
    await access(targetDir);
    log.error(`Directory "${opts.name}" already exists. Choose a different name or remove it first.`);
    process.exit(1);
  } catch {
    // Expected — directory doesn't exist, which is correct
  }

  log.info(`Scaffolding ${opts.lang.toUpperCase()} project at ./${opts.name} ...`);

  await mkdir(targetDir, { recursive: true });

  // Copy the template tree
  const templateDir = getTemplateDir(opts.lang);
  await copyDir(templateDir, targetDir);

  // Interpolate __DJSKIT_VAR__ placeholders
  await interpolateDir(targetDir, {
    BOT_TOKEN: opts.token,
    CLIENT_ID: opts.clientId,
    GUILD_ID: opts.guildId,
    PREFIX: opts.prefix,
    PROJECT_NAME: opts.name,
  });

  if (opts.bare) {
    const commandsDir = join(targetDir, 'src', 'commands');
    const componentsDir = join(targetDir, 'src', 'components');
    await rm(commandsDir, { recursive: true, force: true });
    await rm(componentsDir, { recursive: true, force: true });
    await mkdir(join(commandsDir, 'slash'), { recursive: true });
    await mkdir(join(commandsDir, 'prefix'), { recursive: true });
    await mkdir(join(componentsDir, 'buttons'), { recursive: true });
    await mkdir(join(componentsDir, 'modals'), { recursive: true });
    await mkdir(join(componentsDir, 'selects'), { recursive: true });
  }

  // Write .env with actual secrets (template has .env.example without values)
  const envContent = `DISCORD_TOKEN=${opts.token}\n`;
  await writeFile(join(targetDir, '.env'), envContent, 'utf-8');

  log.success('Project files created!');

  if (opts.install) {
    log.info('Installing dependencies (this may take a moment)...');
    try {
      execSync('npm install', { cwd: targetDir, stdio: 'inherit' });
      log.success('Dependencies installed!');
    } catch {
      log.warn('npm install failed. Run it manually in your project directory.');
    }
  }

  // Print next steps
  console.log();
  console.log(pc.bold('Next steps:'));
  log.step(`cd ${opts.name}`);
  if (!opts.install) log.step('npm install');
  log.step('npm run dev');
  console.log();
  console.log(pc.dim('  Slash commands are registered to your guild automatically on startup.'));
  console.log(pc.dim(`  Prefix commands respond to ${opts.prefix}<command>.`));
  console.log();
}
