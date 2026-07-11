import { createSlashCommand } from '../../builders/index.js';
import { ParamType } from '../../builders/types.js';
import { infoEmbed } from '../../lib/embeds.js';
import { safeEdit } from '../../lib/responses.js';

export default createSlashCommand('ping')
  .setDescription('Check the bot latency')
  .setCategory('General')
  .addExample('/ping')
  .addParam('style', ParamType.String, { description: 'Response style', autocomplete: true })
  .setCooldown(5)
  .setExecute(async (interaction) => {
    const sent = await interaction.reply({ content: 'Pinging...', fetchReply: true });
    const latency = sent.createdTimestamp - interaction.createdTimestamp;
    await safeEdit(interaction, {
      content: '',
      embeds: [
        infoEmbed({
          title: 'Pong',
          description: `Latency: ${latency}ms | API: ${interaction.client.ws.ping}ms`,
        }),
      ],
    });
  });
