import type {
  InteractionReplyOptions,
  Message,
  MessageCreateOptions,
  RepliableInteraction,
} from 'discord.js';

export type ReplyTarget = RepliableInteraction | Message;
export type ReplyPayload = string | InteractionReplyOptions | MessageCreateOptions;

function normalizePayload(payload: ReplyPayload): unknown {
  return typeof payload === 'string' ? { content: payload } : payload;
}

export async function safeReply(target: ReplyTarget, payload: ReplyPayload) {
  const options = normalizePayload(payload);

  if ('reply' in target && 'author' in target) {
    return target.reply(options as MessageCreateOptions);
  }

  if (target.replied || target.deferred) {
    return target.followUp(options as InteractionReplyOptions);
  }

  return target.reply(options as InteractionReplyOptions);
}

export async function safeEdit(target: RepliableInteraction, payload: ReplyPayload) {
  const options = normalizePayload(payload);

  if (target.deferred || target.replied) {
    return target.editReply(options as any);
  }

  return target.reply(options as InteractionReplyOptions);
}

export async function safeDefer(target: RepliableInteraction, ephemeral = false): Promise<void> {
  if (target.deferred || target.replied) return;
  await target.deferReply({ ephemeral });
}

export async function safeEphemeral(target: RepliableInteraction, payload: ReplyPayload) {
  const options = { ...(normalizePayload(payload) as Record<string, unknown>), ephemeral: true };
  return safeReply(target, options);
}
