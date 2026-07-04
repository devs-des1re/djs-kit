import { createButton } from '../../builders/index.js';
export default createButton('confirm_delete')
    .addParam('userId')
    .addParam('itemId')
    .setExecute(async (interaction, args) => {
    await interaction.reply({ content: 'Deletion confirmed for item ' + args.itemId + ' by <@' + args.userId + '>.', ephemeral: true });
});
