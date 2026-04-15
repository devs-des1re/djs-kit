const { Interaction, Client } = require('discord.js');
const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = {
  data: new SlashCommandBuilder()
    .setName('example')
    .setDescription('Example command.'),
  disabled: true,
  roles: [],
  users: [],

  /**
   * 
   * @param {Interaction} interaction 
   * @param {Client} client 
   */
  async execute(interaction, client) {

  }
}