import { createSelect } from '../../builders/index.js';
import { SelectType } from '../../builders/types.js';
export default createSelect('role_menu', { type: SelectType.Role })
    .setExecute(async (interaction, values) => {
    const roles = values;
    await interaction.reply({ content: 'Selected roles: ' + roles.map(r => r.name).join(', '), ephemeral: true });
});
