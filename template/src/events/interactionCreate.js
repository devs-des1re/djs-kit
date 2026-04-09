const { Events, Interaction, Client, MessageFlags } = require('discord.js');
const permissionCheck = require('../utils/permissionCheck');
const logger = require('../utils/logger');

async function safeReply(interaction, options) {
  if (!options.flags) {
    options.flags = MessageFlags.Ephemeral;
  }
  
  try {
    if (interaction.deferred || interaction.replied) {
      return await interaction.followUp(options);
    } else {
      return await interaction.reply(options);
    }
  } catch (error) {
    logger.error(`Failed to respond to interaction: ${error}`);
  }
}

module.exports = {
  name: Events.InteractionCreate,
  disabled: false,
  once: false,

  /**
   * 
   * @param {Interaction} interaction 
   * @param {Client} client 
   */
  async execute(interaction, client) {
    if (interaction.isChatInputCommand()) {
      const command = client.slash.get(interaction.commandName);

      if (!command) {
        return safeReply(interaction, { content: 'The command was not found.' });
      }

      if (!permissionCheck(interaction, command)) {
        return safeReply(interaction, { content: 'You do not have permission to use this command.' });
      }

      try {
        await command.execute(interaction, client);
      } catch (error) {
        logger.error(error);
        await safeReply(interaction, { content: 'There was an error executing this command.' });
      }
    } else if (interaction.isButton()) {
      const button = client.buttons.get(interaction.customId);

      if (!button) {
        return safeReply(interaction, { content: 'Button not found.' });
      }
      if (button.disabled) return;

      if (!permissionCheck(interaction, button)) {
        return safeReply(interaction, { content: 'You do not have the permission to use this button.' });
      }

      try {
        await button.execute(interaction, client);
      } catch (error) {
        logger.error(error);
        await safeReply(interaction, { content: 'There was an error while executing this button.' });
      }
    } else if (interaction.isStringSelectMenu()) {
      const selectMenu = client.selectMenus.get(interaction.customId);

      if (!selectMenu) {
        return safeReply(interaction, { content: 'Dropdown not found.' });
      }
      if (selectMenu.disabled) return;

      if (!permissionCheck(interaction, selectMenu)) {
        return safeReply(interaction, { content: 'You do not have the permission to use this dropdown.' });
      }

      try {
        await selectMenu.execute(interaction, client);
      } catch (error) {
        logger.error(error);
        await safeReply(interaction, { content: 'There was an error while executing this dropdown.' });
      }
    } else if (interaction.isModalSubmit()) {
      const modal = client.modals.get(interaction.customId);

      if (!modal) {
        return safeReply(interaction, { content: 'Modal not found.' });
      }
      if (modal.disabled) return;

      if (!permissionCheck(interaction, modal)) {
        return safeReply(interaction, { content: 'You do not have the permission to use this modal.' });
      }

      try {
        await modal.execute(interaction, client);
      } catch (error) {
        logger.error(error);
        await safeReply(interaction, { content: 'There was an error while executing this modal.' });
      }
    }
  }
};