function normalizePayload(payload) {
    return typeof payload === 'string' ? { content: payload } : payload;
}
export async function safeReply(target, payload) {
    const options = normalizePayload(payload);
    if ('reply' in target && 'author' in target) {
        return target.reply(options);
    }
    if (target.replied || target.deferred) {
        return target.followUp(options);
    }
    return target.reply(options);
}
export async function safeEdit(target, payload) {
    const options = normalizePayload(payload);
    if (target.deferred || target.replied) {
        return target.editReply(options);
    }
    return target.reply(options);
}
export async function safeDefer(target, ephemeral = false) {
    if (target.deferred || target.replied)
        return;
    await target.deferReply({ ephemeral });
}
export async function safeEphemeral(target, payload) {
    const options = { ...normalizePayload(payload), ephemeral: true };
    return safeReply(target, options);
}
