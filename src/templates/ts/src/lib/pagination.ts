import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  type APIEmbed,
  type ButtonInteraction,
  type EmbedBuilder,
  type InteractionReplyOptions,
  type RepliableInteraction,
} from 'discord.js';
import { buildCustomId, parseCustomId } from './customId.js';

export type PageContent = string | EmbedBuilder | APIEmbed;

export interface PaginationOptions {
  userId: string;
  guildId?: string | null;
  timeoutMs?: number;
  ephemeral?: boolean;
}

function pagePayload(page: PageContent, components: ActionRowBuilder<ButtonBuilder>[], ephemeral?: boolean): InteractionReplyOptions {
  if (typeof page === 'string') return { content: page, components, ephemeral, fetchReply: true };
  return { embeds: [page], components, ephemeral, fetchReply: true };
}

function updatePayload(page: PageContent, components: ActionRowBuilder<ButtonBuilder>[]) {
  if (typeof page === 'string') return { content: page, embeds: [], components };
  return { content: '', embeds: [page], components };
}

function paginationRow(id: string, index: number, total: number, options: PaginationOptions) {
  const scoped = { expiresIn: Math.ceil((options.timeoutMs ?? 60_000) / 1000), userId: options.userId, guildId: options.guildId ?? undefined };
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(buildCustomId('paginate', { id, action: 'prev' }, scoped))
      .setStyle(ButtonStyle.Secondary)
      .setLabel('Previous')
      .setDisabled(index === 0),
    new ButtonBuilder()
      .setCustomId(buildCustomId('paginate', { id, action: 'next' }, scoped))
      .setStyle(ButtonStyle.Primary)
      .setLabel('Next')
      .setDisabled(index >= total - 1)
  );
}

export async function paginate(
  interaction: RepliableInteraction,
  pages: PageContent[],
  options: PaginationOptions
): Promise<void> {
  if (pages.length === 0) {
    await interaction.reply({ content: 'No pages to show.', ephemeral: options.ephemeral });
    return;
  }

  const timeoutMs = options.timeoutMs ?? 60_000;
  const id = `${interaction.id}:${Date.now()}`;
  let index = 0;
  const components = () => [paginationRow(id, index, pages.length, options)];
  const initial = pagePayload(pages[index], components(), options.ephemeral);
  const message = interaction.replied || interaction.deferred
    ? await interaction.followUp(initial)
    : await interaction.reply(initial);

  const collector = message.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: timeoutMs,
    filter: (component): component is ButtonInteraction => {
      if (!component.isButton() || component.user.id !== options.userId) return false;
      const parsed = parseCustomId(component.customId, { userId: component.user.id, guildId: component.guildId });
      return parsed.valid && parsed.base === 'paginate' && parsed.params[0] === id;
    },
  });

  collector.on('collect', async (button) => {
    const parsed = parseCustomId(button.customId, { userId: button.user.id, guildId: button.guildId });
    const action = parsed.params[1];
    if (action === 'prev') index = Math.max(0, index - 1);
    if (action === 'next') index = Math.min(pages.length - 1, index + 1);
    await button.update(updatePayload(pages[index], components()));
  });

  collector.on('end', async () => {
    const disabled = paginationRow(id, index, pages.length, options);
    disabled.components.forEach(component => component.setDisabled(true));
    await message.edit({ components: [disabled] }).catch(() => {});
  });
}
