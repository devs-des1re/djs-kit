import { createMessageContextMenu } from '../../builders/index.js';
import type { Message } from 'discord.js';

export default createMessageContextMenu('Quote Message')
  .setExecute(async (interaction, target) => {
    const message = target as Message;
    await interaction.reply({
      content: message.content ? `> ${message.content}` : 'That message has no text content.',
      ephemeral: true,
    });
  });
