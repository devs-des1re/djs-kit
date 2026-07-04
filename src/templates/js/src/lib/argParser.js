import { ParamType } from '../builders/types.js';
export async function parseArgs(message, tokens, params, guild, consumedTokens) {
    const args = {};
    const restTokens = [...tokens];
    let rawIndex = 0;
    for (const param of params) {
        if (restTokens.length === 0) {
            if (param.required) {
                await message.reply(`Missing required argument: \`${param.name}\` (${param.description ?? param.type})`);
                return null;
            }
            args[param.name] = undefined;
            continue;
        }
        const token = restTokens.shift();
        rawIndex += token.length + 1; // approx raw calculation
        let resolved = null;
        switch (param.type) {
            case ParamType.String:
                resolved = token;
                if (param.choices && !param.choices.includes(token)) {
                    await message.reply(`Invalid choice for \`${param.name}\`. Must be one of: ${param.choices.join(', ')}`);
                    return null;
                }
                break;
            case ParamType.Number:
                resolved = parseFloat(token);
                if (isNaN(resolved)) {
                    if (param.required) {
                        await message.reply(`Invalid number for \`${param.name}\`.`);
                        return null;
                    }
                    resolved = null;
                }
                break;
            case ParamType.Boolean:
                if (['true', 'yes', '1', 'y'].includes(token.toLowerCase()))
                    resolved = true;
                else if (['false', 'no', '0', 'n'].includes(token.toLowerCase()))
                    resolved = false;
                else if (param.required) {
                    await message.reply(`Invalid boolean for \`${param.name}\`.`);
                    return null;
                }
                break;
            case ParamType.User:
            case ParamType.Member:
                const idMatch = token.match(/^<@!?(\d+)>$/) || token.match(/^(\d+)$/);
                if (idMatch) {
                    try {
                        const member = await guild.members.fetch(idMatch[1]);
                        resolved = param.type === ParamType.Member ? member : member.user;
                    }
                    catch {
                        // Not found by ID
                    }
                }
                if (!resolved) {
                    const search = await guild.members.fetch({ query: token, limit: 1 });
                    if (search.size > 0) {
                        const member = search.first();
                        resolved = param.type === ParamType.Member ? member : member.user;
                    }
                }
                if (!resolved && param.required) {
                    await message.reply(`Could not find user/member for \`${param.name}\`.`);
                    return null;
                }
                break;
            case ParamType.Channel:
            case ParamType.TextChannel:
                const chanId = token.match(/^<#(\d+)>$/) || token.match(/^(\d+)$/);
                if (chanId)
                    resolved = guild.channels.cache.get(chanId[1]);
                if (!resolved)
                    resolved = guild.channels.cache.find(c => c.name.toLowerCase() === token.toLowerCase());
                if (resolved && param.type === ParamType.TextChannel && !resolved.isTextBased()) {
                    await message.reply(`Channel \`${param.name}\` must be a text channel.`);
                    return null;
                }
                if (!resolved && param.required) {
                    await message.reply(`Could not find channel for \`${param.name}\`.`);
                    return null;
                }
                break;
            case ParamType.Role:
                const roleId = token.match(/^<@&(\d+)>$/) || token.match(/^(\d+)$/);
                if (roleId)
                    resolved = guild.roles.cache.get(roleId[1]);
                if (!resolved)
                    resolved = guild.roles.cache.find(r => r.name.toLowerCase() === token.toLowerCase());
                if (!resolved && param.required) {
                    await message.reply(`Could not find role for \`${param.name}\`.`);
                    return null;
                }
                break;
        }
        if (resolved === null && param.required) {
            await message.reply(`Failed to parse required argument \`${param.name}\`.`);
            return null;
        }
        args[param.name] = resolved;
    }
    const totalConsumed = consumedTokens + (tokens.length - restTokens.length);
    const rawMatch = message.content.match(new RegExp(`^(?:\\S+\\s+){${totalConsumed}}(.*)$`));
    const raw = rawMatch ? rawMatch[1] : restTokens.join(' ');
    return {
        ...args,
        _raw: raw,
        _rest: restTokens,
    };
}
