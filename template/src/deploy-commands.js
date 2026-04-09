const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const logger = require('./utils/logger');
require('dotenv').config();

async function deployCommands() {
  const commands = [];
  const commandsPath = path.join(__dirname, 'commands');

  const getCommandFiles = (dir) => {
    let files = [];
    const items = fs.readdirSync(dir, { withFileTypes: true });

    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      if (item.isDirectory()) {
        files = files.concat(getCommandFiles(fullPath));
      } else if (item.isFile() && item.name.endsWith('.js')) {
        files.push(fullPath);
      }
    }

    return files;
  };

  const commandFiles = getCommandFiles(commandsPath);

  for (const file of commandFiles) {
    const command = require(file);
    if ('data' in command && 'execute' in command && command.disabled === false) {
      commands.push(command.data.toJSON());
      logger.info(`Prepared command: ${command.data.name}`);
    } else if (command.disabled === true) {
      logger.info(`Skipping disabled command: ${command.data?.name || path.basename(file)}`);
    }
  }

  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

  try {
    logger.info('Starting command deployment...');

    if (process.env.DISCORD_GUILD_ID) {
      logger.info(`Clearing guild commands for ${process.env.DISCORD_GUILD_ID}...`);
      await rest.put(
        Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, process.env.DISCORD_GUILD_ID),
        { body: [] }
      );
      logger.success('Cleared all guild commands');
    } else {
      logger.info('Clearing global commands...');
      await rest.put(
        Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
        { body: [] }
      );
      logger.success('Cleared all global commands');
    }

    logger.info(`Registering ${commands.length} new commands...`);
    
    if (process.env.DISCORD_GUILD_ID) {
      await rest.put(
        Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, process.env.DISCORD_GUILD_ID),
        { body: commands }
      );
      logger.success(`Successfully registered ${commands.length} guild commands`);
    } else {
      await rest.put(
        Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
        { body: commands }
      );
      logger.success(`Successfully registered ${commands.length} global commands`);
    }

    logger.success('Command deployment completed!');
    
    if (commands.length > 0) {
      logger.info('Registered commands:');
      commands.forEach(cmd => {
        logger.info(`  /${cmd.name}`);
      });
    } else {
      logger.warn('No commands were registered');
    }
  } catch (error) {
    logger.error('Failed to deploy commands:');
    logger.error(error);
  }
}

deployCommands();