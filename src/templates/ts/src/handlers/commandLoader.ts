import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, join } from 'path';
import fg from 'fast-glob';
import { REST, Routes, SlashCommandBuilder, Client, ChannelType, PermissionsBitField, ContextMenuCommandBuilder, ApplicationCommandType } from 'discord.js';
import { config } from '../config.js';
import type { CommandDescriptor, ParamDescriptor } from '../builders/index.js';
import { ParamType } from '../builders/types.js';
import { logger } from '../lib/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function addParamOption(builder: SlashCommandBuilder | any, param: ParamDescriptor): void {
  const buildOpts = (opt: any) => {
    opt
      .setName(param.name)
      .setDescription(param.description ?? param.name)
      .setRequired(param.required);

    if (param.choices?.length && typeof opt.addChoices === 'function') {
      if (param.type === ParamType.Number) {
        opt.addChoices(
          ...param.choices
            .map(choice => ({ name: choice, value: Number(choice) }))
            .filter(choice => !Number.isNaN(choice.value))
        );
      } else {
        opt.addChoices(...param.choices.map(choice => ({ name: choice, value: choice })));
      }
    }

    if (param.autocomplete && typeof opt.setAutocomplete === 'function') {
      opt.setAutocomplete(true);
    }

    return opt;
  };

  if (param.type === ParamType.String) builder.addStringOption(buildOpts);
  else if (param.type === ParamType.User || param.type === ParamType.Member) builder.addUserOption(buildOpts);
  else if (param.type === ParamType.Role) builder.addRoleOption(buildOpts);
  else if (param.type === ParamType.Channel) builder.addChannelOption(buildOpts);
  else if (param.type === ParamType.TextChannel) {
    builder.addChannelOption((opt: any) =>
      buildOpts(opt).addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement, ChannelType.GuildVoice)
    );
  }
  else if (param.type === ParamType.Number) builder.addNumberOption(buildOpts);
  else if (param.type === ParamType.Boolean) builder.addBooleanOption(buildOpts);
}

function sortedParams(params: ParamDescriptor[]): ParamDescriptor[] {
  return [...params].sort((a, b) => Number(b.required) - Number(a.required));
}

function validateCommand(desc: CommandDescriptor, filePath: string): void {
  if (desc.name !== desc.name.toLowerCase()) {
    logger.warn(`Command "${desc.name}" in ${filePath} should be lowercase.`);
  }

  const paramNames = new Set<string>();
  for (const param of desc.params) {
    if (paramNames.has(param.name)) {
      logger.warn(`Command "${desc.name}" has duplicate param "${param.name}".`);
    }
    paramNames.add(param.name);
  }

  if (desc.commandType === 'slash' && desc.aliases.length > 0) {
    logger.warn(`Slash command "${desc.name}" defines aliases, but aliases only apply to prefix commands.`);
  }
}

export async function loadCommands(client: Client): Promise<void> {
  const FILE_EXT = import.meta.url.endsWith('.ts') ? 'ts' : 'js';
  const baseDir = join(__dirname, '..', 'commands');
  
  // Find all command files
  const slashFiles = config.commandMode === 'prefix'
    ? []
    : await fg(`slash/**/*.${FILE_EXT}`, { cwd: baseDir.replace(/\\/g, '/'), absolute: true });
  const prefixFiles = config.commandMode === 'slash'
    ? []
    : await fg(`prefix/**/*.${FILE_EXT}`, { cwd: baseDir.replace(/\\/g, '/'), absolute: true });

  const slashCommands = new Map<string, { desc: CommandDescriptor; path: string }>();
  const prefixCommands = new Map<string, { desc: CommandDescriptor; path: string }>();

  // Helper to load and validate a file
  async function loadFile(filePath: string, type: 'slash' | 'prefix') {
    const mod = await import(pathToFileURL(filePath).href);
    if (!mod.default || typeof mod.default.build !== 'function') {
      logger.warn(`File ${filePath} does not default export a builder. Skipping.`);
      return;
    }
    
    const desc: CommandDescriptor = mod.default.build();
    if (desc.commandType !== type) {
      logger.warn(`File ${filePath} exported a ${desc.commandType} command but is in the ${type} folder. Skipping.`);
      return;
    }
    validateCommand(desc, filePath);

    const map = type === 'slash' ? slashCommands : prefixCommands;
    if (map.has(desc.name)) {
      throw new Error(`[CommandLoader] Duplicate ${type} command name "${desc.name}" found in ${filePath} and ${map.get(desc.name)!.path}`);
    }
    
    map.set(desc.name, { desc, path: filePath });
    
    if (type === 'slash') {
      client.slashCommands.set(desc.name, desc);
    } else {
      client.prefixCommands.set(desc.name, desc);
      for (const alias of desc.aliases) {
        if (client.prefixCommands.has(alias)) {
          throw new Error(`[CommandLoader] Duplicate prefix alias "${alias}" found in ${filePath}`);
        }
        client.prefixCommands.set(alias, desc);
      }
    }
  }

  await Promise.all([
    ...slashFiles.map(f => loadFile(f, 'slash')),
    ...prefixFiles.map(f => loadFile(f, 'prefix'))
  ]);

  logger.info(`Loaded ${slashCommands.size} slash commands and ${prefixCommands.size} prefix commands.`);

  // Register slash commands to Discord
  if (slashCommands.size > 0 && config.token && config.clientId && config.guildId) {
    const rest = new REST({ version: '10' }).setToken(config.token);
    const body: unknown[] = [];

    for (const { desc } of slashCommands.values()) {
      const builder = new SlashCommandBuilder()
        .setName(desc.name)
        .setDescription(desc.description ?? 'No description provided');

      if (desc.defaultMemberPermissions) {
        builder.setDefaultMemberPermissions(PermissionsBitField.resolve(desc.defaultMemberPermissions));
      }

      if (desc.subcommands.length > 0) {
        for (const sub of desc.subcommands) {
          builder.addSubcommand(subBuilder => {
            subBuilder
              .setName(sub.name)
              .setDescription(sub.description ?? sub.name);

            for (const param of sortedParams(sub.params)) {
              addParamOption(subBuilder, param);
            }

            return subBuilder;
          });
        }
      } else {
        for (const param of sortedParams(desc.params)) {
          addParamOption(builder, param);
        }
      }

      body.push(builder.toJSON());
    }

    for (const desc of client.contextMenus.values()) {
      const builder = new ContextMenuCommandBuilder()
        .setName(desc.name)
        .setType(desc.type === 'user' ? ApplicationCommandType.User : ApplicationCommandType.Message);

      if (desc.defaultMemberPermissions) {
        builder.setDefaultMemberPermissions(PermissionsBitField.resolve(desc.defaultMemberPermissions));
      }

      body.push(builder.toJSON());
    }

    try {
      logger.info('Started refreshing application (/) commands.');
      if (config.commandRegistration === 'global') {
        await rest.put(Routes.applicationCommands(config.clientId), { body });
      } else if (config.commandRegistration === 'multiGuild') {
        await Promise.all(config.guildIds.map(guildId =>
          rest.put(Routes.applicationGuildCommands(config.clientId, guildId), { body })
        ));
      } else {
        await rest.put(Routes.applicationGuildCommands(config.clientId, config.guildId), { body });
      }
      logger.success('Successfully reloaded application (/) commands.');
    } catch (error) {
      logger.error('Failed to reload application (/) commands.', error);
    }
  }
}
