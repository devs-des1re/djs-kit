const { Events, Message, Client } = require('discord.js');

module.exports = {
  name: 'example-prefix',
  aliases: ['exm'],
  disabled: true,
  roles: [],
  users: [],
  
  /**
   * 
   * @param {Message} message 
   * @param {Array} args 
   * @param {Client} client 
   */
  async execute(message, args, client) {
    await message.reply('Example');
  }
}