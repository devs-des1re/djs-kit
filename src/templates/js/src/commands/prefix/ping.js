import { createPrefixCommand } from '../../builders/index.js';
export default createPrefixCommand('ping')
    .setCooldown(5)
    .setExecute(async (message) => {
    const sent = await message.reply('Pinging...');
    const latency = sent.createdTimestamp - message.createdTimestamp;
    await sent.edit('Pong! Latency: ' + latency + 'ms | API: ' + message.client.ws.ping + 'ms');
});
