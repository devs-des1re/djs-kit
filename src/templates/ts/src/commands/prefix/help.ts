import { createPrefixCommand } from '../../builders/index.js';
import { config } from '../../config.js';

export default createPrefixCommand('help')
  .setDescription('Show available commands')
  .setCategory('General')
  .addAlias('commands')
  .addExample('!help')
  .setExecute(async (message) => {
    const commandsByCategory = new Map<string, string[]>();

    for (const command of message.client.prefixCommands.values()) {
      const category = command.category ?? 'General';
      const aliasText = command.aliases.length ? ` (aliases: ${command.aliases.join(', ')})` : '';
      const line = `${config.prefix}${command.name} - ${command.description ?? 'No description provided'}${aliasText}`;
      const existing = commandsByCategory.get(category) ?? [];
      if (!existing.includes(line)) existing.push(line);
      commandsByCategory.set(category, existing);
    }

    const content = [...commandsByCategory.entries()]
      .map(([category, commands]) => `**${category}**\n${commands.sort().join('\n')}`)
      .join('\n\n');

    await message.reply(content || 'No commands are loaded.');
  });
