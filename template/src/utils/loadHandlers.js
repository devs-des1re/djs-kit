const fs = require('fs');
const path = require('path');

function loadHandlers(client) {
  const handlersPath = path.join(__dirname, '../handlers');
  const handlerFiles = fs.readdirSync(handlersPath).filter(file => file.endsWith('.js'));

  for (const file of handlerFiles) {
    const handler = require(`../handlers/${file}`);
    handler(client);
  }
}

module.exports = loadHandlers