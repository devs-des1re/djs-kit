const mongoose = require('mongoose');
const logger = require("./logger");

async function connectMongo() {
  try {
    if (!process.env.MONGODB_URI) {
      logger.warn('MONGODB_URI not found in .env file. Skipping database connection.');
      return;
    }

    await mongoose.connect(process.env.MONGODB_URI);
    logger.success('Connected to MongoDB successfully!');
    
    mongoose.connection.on('error', (error) => {
      logger.error('MongoDB connection error:', error);
    });
    
    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });
    
  } catch (error) {
    logger.error('Failed to connect to MongoDB:', error.message);
    logger.warn('Bot will continue without database functionality');
  }
}

module.exports = connectMongo