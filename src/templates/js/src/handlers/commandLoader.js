import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, join } from 'path';
import fg from 'fast-glob';
import { REST, Routes, SlashCommandBuilder, ChannelType } from 'discord.js';
import { config } from '../config.js';
import { ParamType } from '../builders/types.js';
import { logger } from '../lib/logger.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
export async function loadCommands(client) {
    const FILE_EXT = import.meta.url.endsWith('.ts') ? 'ts' : 'js';
    const baseDir = join(__dirname, '..', 'commands');
    // Find all command files
    const slashFiles = await fg(`slash/**/*.${FILE_EXT}`, { cwd: baseDir.replace(/\\/g, '/'), absolute: true });
    const prefixFiles = await fg(`prefix/**/*.${FILE_EXT}`, { cwd: baseDir.replace(/\\/g, '/'), absolute: true });
    const slashCommands = new Map();
    const prefixCommands = new Map();
    // Helper to load and validate a file
    async function loadFile(filePath, type) {
        const mod = await import(pathToFileURL(filePath).href);
        if (!mod.default || typeof mod.default.build !== 'function') {
            logger.warn(`File ${filePath} does not default export a builder. Skipping.`);
            return;
        }
        const desc = mod.default.build();
        if (desc.commandType !== type) {
            logger.warn(`File ${filePath} exported a ${desc.commandType} command but is in the ${type} folder. Skipping.`);
            return;
        }
        const map = type === 'slash' ? slashCommands : prefixCommands;
        if (map.has(desc.name)) {
            throw new Error(`[CommandLoader] Duplicate ${type} command name "${desc.name}" found in ${filePath} and ${map.get(desc.name).path}`);
        }
        map.set(desc.name, { desc, path: filePath });
        if (type === 'slash') {
            client.slashCommands.set(desc.name, desc);
        }
        else {
            client.prefixCommands.set(desc.name, desc);
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
        const body = [];
        for (const { desc } of slashCommands.values()) {
            const builder = new SlashCommandBuilder()
                .setName(desc.name)
                .setDescription(desc.description ?? 'No description provided');
            for (const param of desc.params) {
                const buildOpts = (opt) => opt
                    .setName(param.name)
                    .setDescription(param.description ?? param.name)
                    .setRequired(param.required);
                if (param.type === ParamType.String)
                    builder.addStringOption(buildOpts);
                else if (param.type === ParamType.User || param.type === ParamType.Member)
                    builder.addUserOption(buildOpts);
                else if (param.type === ParamType.Role)
                    builder.addRoleOption(buildOpts);
                else if (param.type === ParamType.Channel)
                    builder.addChannelOption(buildOpts);
                else if (param.type === ParamType.TextChannel)
                    builder.addChannelOption(opt => buildOpts(opt).addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement, ChannelType.GuildVoice));
                else if (param.type === ParamType.Number)
                    builder.addNumberOption(buildOpts);
                else if (param.type === ParamType.Boolean)
                    builder.addBooleanOption(buildOpts);
            }
            body.push(builder.toJSON());
        }
        try {
            logger.info('Started refreshing application (/) commands.');
            await rest.put(Routes.applicationGuildCommands(config.clientId, config.guildId), { body });
            logger.success('Successfully reloaded application (/) commands.');
        }
        catch (error) {
            logger.error('Failed to reload application (/) commands:');
            console.error(error);
        }
    }
}
