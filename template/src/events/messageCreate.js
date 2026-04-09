const { Events, Message, Client } = require('discord.js');
const permissionCheck = require('../utils/permissionCheck');
const logger = require('../utils/logger');

module.exports = {
  name: Events.MessageCreate,
  disabled: false,
  once: false,

  async execute(message, client) {
    if (message.author.bot) return;

    const prefix = client.config?.prefix || '!';
    if (!message.content.startsWith(prefix)) return;
    
    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();
    
    let command = client.prefix.get(commandName);
    
    if (!command) {
      const aliasCommand = client.prefix.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
      if (aliasCommand) {
        command = aliasCommand;
      } else {
        return;
      }
    }
    
    if (command.disabled) return;
    
    if (!permissionCheck(message, command)) {
      return message.reply({ content: 'You do not have permission to use this command!' });
    }
    
    try {
      await command.execute(message, args, client);
    } catch (error) {
      logger.error(`Error executing prefix command ${commandName}:`, error);
      await message.reply({ content: 'There was an error executing this command!' });
    }
  }
};