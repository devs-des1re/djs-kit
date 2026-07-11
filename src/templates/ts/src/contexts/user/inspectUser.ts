import { createUserContextMenu } from '../../builders/index.js';

export default createUserContextMenu('Inspect User')
  .setExecute(async (interaction, target) => {
    await interaction.reply({
      content: `User: ${target.toString()}`,
      ephemeral: true,
    });
  });
