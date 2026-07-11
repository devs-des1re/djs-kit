import { createSlashCommand } from '../../builders/index.js';
export default createSlashCommand('help')
    .setDescription('Show available commands')
    .setCategory('General')
    .addExample('/help')
    .setExecute(async (interaction) => {
    const commandsByCategory = new Map();
    for (const command of interaction.client.slashCommands.values()) {
        const category = command.category ?? 'General';
        const line = `/${command.name} - ${command.description ?? 'No description provided'}`;
        const existing = commandsByCategory.get(category) ?? [];
        if (!existing.includes(line))
            existing.push(line);
        commandsByCategory.set(category, existing);
    }
    const content = [...commandsByCategory.entries()]
        .map(([category, commands]) => `**${category}**\n${commands.sort().join('\n')}`)
        .join('\n\n');
    await interaction.reply({
        content: content || 'No commands are loaded.',
        ephemeral: true,
    });
});
