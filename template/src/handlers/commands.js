const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

module.exports = (client) => {
  const commandsPath = path.join(__dirname, '../commands/slash');
  const prefixPath = path.join(__dirname, '../commands/prefix');

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

  if (fs.existsSync(commandsPath)) {
    const commandFiles = getCommandFiles(commandsPath);

    for (const file of commandFiles) {
      const command = require(file);

      if (command.data && command.execute && command.disabled !== true) {
        client.slash.set(command.data.name, command);
        logger.success(`Loaded slash command: ${command.data.name}`);
      } else if (command.disabled === true) {
        logger.info(`Skipped disabled slash command: ${command.data?.name || path.basename(file)}`);
      } else {
        logger.warn(`Slash command ${path.relative(commandsPath, file)} is missing required properties`);
      }
    }
  }

  if (fs.existsSync(prefixPath)) {
    const prefixFiles = fs.readdirSync(prefixPath).filter(file => file.endsWith('.js'));

    for (const file of prefixFiles) {
      const command = require(`../commands/prefix/${file}`);

      if (command.name && command.execute && command.disabled !== true) {
        client.prefix.set(command.name, command);
        logger.success(`Loaded prefix command: ${command.name}`);
      } else if (command.disabled === true) {
        logger.info(`Skipped disabled prefix command: ${command.name || path.basename(file)}`);
      } else {
        logger.warn(`Prefix command ${file} is missing required properties`);
      }
    }
  }
};