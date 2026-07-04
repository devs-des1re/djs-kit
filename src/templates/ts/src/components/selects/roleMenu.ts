import { createSelect } from '../../builders/index.js';
import { SelectType } from '../../builders/types.js';
import type { Role } from 'discord.js';

export default createSelect('role_menu', { type: SelectType.Role })
  .setExecute(async (interaction, values) => {
    const roles = values as Role[];
    await interaction.reply({ content: 'Selected roles: ' + roles.map(r => r.name).join(', '), ephemeral: true });
  });
