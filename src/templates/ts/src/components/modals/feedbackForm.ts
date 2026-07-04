import { createModal } from '../../builders/index.js';
import { FieldStyle } from '../../builders/types.js';

export default createModal('feedback_form')
  .setTitle('Submit Feedback')
  .addField('summary', { label: 'Summary', style: FieldStyle.Short, minLength: 5, maxLength: 100, required: true, placeholder: 'Brief summary' })
  .addField('details', { label: 'Details', style: FieldStyle.Paragraph, required: false, placeholder: 'Any additional details...' })
  .setExecute(async (interaction, fields) => {
    await interaction.reply({ content: 'Feedback received! Summary: ' + fields.summary, ephemeral: true });
  });
