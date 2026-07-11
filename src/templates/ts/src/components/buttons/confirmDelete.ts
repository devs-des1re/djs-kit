import { createButton } from '../../builders/index.js';
import { buildCustomId } from '../../lib/customId.js';

// Usage elsewhere:
// buildCustomId('confirm_delete', { userId: interaction.user.id, itemId: '123' }, { expiresIn: 300, userId: interaction.user.id })
export default createButton('confirm_delete')
  .addParam('userId')
  .addParam('itemId')
  .setExecute(async (interaction, args) => {
    await interaction.reply({ content: 'Deletion confirmed for item ' + args.itemId + ' by <@' + args.userId + '>.', ephemeral: true });
  });
