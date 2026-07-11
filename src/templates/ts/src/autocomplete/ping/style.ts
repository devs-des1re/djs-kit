import { createAutocomplete } from '../../builders/index.js';

const styles = ['short', 'detailed'];

export default createAutocomplete('ping', 'style')
  .setExecute(async (interaction) => {
    const focused = interaction.options.getFocused().toLowerCase();
    await interaction.respond(
      styles
        .filter(style => style.includes(focused))
        .map(style => ({ name: style, value: style }))
    );
  });
