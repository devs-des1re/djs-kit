import { createSlashCommand } from '../../builders/index.js';
export default createSlashCommand('ping')
    .setDescription('Check the bot latency')
    .setCooldown(5)
    .setExecute(async (interaction) => {
    const sent = await interaction.reply({ content: 'Pinging...', fetchReply: true });
    const latency = sent.createdTimestamp - interaction.createdTimestamp;
    await interaction.editReply('Pong! Latency: ' + latency + 'ms | API: ' + interaction.client.ws.ping + 'ms');
});
