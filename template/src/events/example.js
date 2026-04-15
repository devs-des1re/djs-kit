const { Events, Client } = require('discord.js');
const logger = require('../utils/logger');

module.exports = {
  name: Events.ClientReady,
  disabled: true,
  once: false,

  /**
   * 
   * @param {Client} client 
   */
  async execute(client) {
    logger.success(`${client.user.tag} is online!`)
  }
}