const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

function getFiles(dir) {
  let files = []
  const items = fs.readdirSync(dir, { withFileTypes: true })

  for (const item of items) {
    const fullPath = path.join(dir, item.name)
    if (item.isDirectory()) {
      files = files.concat(getFiles(fullPath))
    } else if (item.isFile() && item.name.endsWith('.js')) {
      files.push(fullPath)
    }
  }

  return files
}

module.exports = (client) => {
  const eventsPath = path.join(__dirname, '../events')
  const eventFiles = getFiles(eventsPath)

  for (const file of eventFiles) {
    const event = require(file)

    if (!event.name || !event.execute) {
      logger.warn(`Event file ${path.relative(eventsPath, file)} is missing required properties`)
      continue
    }

    if (event.disabled) {
      logger.info(`Event file ${path.relative(eventsPath, file)} is disabled`)
      continue
    }

    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args, client))
    } else {
      client.on(event.name, (...args) => event.execute(...args, client))
    }

    logger.success(`Loaded event: ${event.name}`);
  }
}