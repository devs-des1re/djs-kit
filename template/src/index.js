const { Client, GatewayIntentBits, Collection } = require('discord.js');
const mongoose = require('mongoose');
require('dotenv').config();

const logger = require('./utils/logger');
const connectMongo = require('./utils/connectMongo');
const loadHandlers = require('./utils/loadHandlers');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ]
});

client.slash = new Collection();
client.prefix = new Collection();
client.buttons = new Collection();
client.selectMenus = new Collection();
client.modals = new Collection();

async function initBot() {
  await connectMongo();
  loadHandlers(client);

  client.login(process.env.DISCORD_TOKEN);
};

async function shutdown() {
  logger.warn('Shutting down bot...');
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.close()
    logger.info('MongoDB connection closed')
  }
  process.exit(0)
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

initBot().catch((err) => logger.error(err));