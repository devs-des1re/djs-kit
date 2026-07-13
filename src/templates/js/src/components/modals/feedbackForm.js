import { createModal } from '../../builders/index.js';
import { FieldStyle } from '../../builders/types.js';
export default createModal('feedback_form')
    .setTitle('Submit Feedback')
    .addTextDisplay('Send a short note and optionally attach a screenshot.')
    .addField('summary', { label: 'Summary', style: FieldStyle.Short, minLength: 5, maxLength: 100, required: true, placeholder: 'Brief summary' })
    .addStringSelect('topic', {
    label: 'Topic',
    options: [
        { label: 'Bug', value: 'bug' },
        { label: 'Feature request', value: 'feature' },
        { label: 'General feedback', value: 'general' },
    ],
})
    .addRadioGroup('priority', {
    label: 'Priority',
    options: [
        { label: 'Normal', value: 'normal', default: true },
        { label: 'Urgent', value: 'urgent' },
    ],
})
    .addImageUpload('screenshot', { label: 'Screenshot', required: false, maxValues: 1 })
    .addField('details', { label: 'Details', style: FieldStyle.Paragraph, required: false, placeholder: 'Any additional details...' })
    .setExecute(async (interaction, fields) => {
    await interaction.reply({ content: `Feedback received! Topic: ${fields.topic} Summary: ${fields.summary}`, ephemeral: true });
});
