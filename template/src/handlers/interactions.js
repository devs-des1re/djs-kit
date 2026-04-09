const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

function loadComponents(folderPath, collection, typeName) {
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

  const files = getFiles(folderPath);
  for (const file of files) {
    const component = require(file);

    if (!component.customId && !component.execute) {
      logger.warn(`${typeName} file ${path.relative(folderPath, file)} is missing required properties`);
      continue;
    }

    if (component.disabled) {
      logger.info(`${typeName} file ${path.relative(folderPath, file)} is disabled`);
      continue;
    }

    collection.set(component.customId, component);
    logger.success(`Loaded ${typeName}: ${component.customId}`);
  }
}

module.exports = (client) => {
  loadComponents(path.join(__dirname, '../buttons'), client.buttons, 'button');
  loadComponents(path.join(__dirname, '../dropdowns'), client.selectMenus, 'select menu');
  loadComponents(path.join(__dirname, '../modals'), client.modals, 'modal');
}