import { ActionRowBuilder, ModalBuilder as DiscordModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';
import { ParamType, FieldStyle, SelectType } from './types.js';
function makeSlashBuilder(state) {
    return {
        setDescription(desc) {
            return makeSlashBuilder({ ...state, description: desc });
        },
        setCategory(category) {
            return makeSlashBuilder({ ...state, category });
        },
        addExample(example) {
            return makeSlashBuilder({ ...state, examples: [...(state.examples ?? []), example] });
        },
        addParam(name, type, opts) {
            const param = {
                name,
                type,
                required: opts?.required ?? false,
                description: opts?.description,
                choices: opts?.choices,
                autocomplete: opts?.autocomplete,
            };
            return makeSlashBuilder({ ...state, params: [...(state.params ?? []), param] });
        },
        addSubcommand(sub) {
            const desc = sub.build();
            return makeSlashBuilder({ ...state, subcommands: [...(state.subcommands ?? []), desc] });
        },
        setPermissions(perms) {
            return makeSlashBuilder({ ...state, permissions: perms });
        },
        setDefaultMemberPermissions(permissions) {
            return makeSlashBuilder({ ...state, defaultMemberPermissions: permissions });
        },
        setOwnerOnly() {
            return makeSlashBuilder({ ...state, permissions: { ...(state.permissions ?? {}), ownerOnly: true } });
        },
        setDevOnly() {
            return makeSlashBuilder({ ...state, permissions: { ...(state.permissions ?? {}), devOnly: true } });
        },
        setCooldown(seconds) {
            return makeSlashBuilder({ ...state, cooldown: seconds });
        },
        setExecute(fn) {
            return makeSlashBuilder({ ...state, execute: fn });
        },
        build() {
            return {
                name: state.name,
                commandType: 'slash',
                description: state.description,
                category: state.category,
                aliases: state.aliases ?? [],
                examples: state.examples ?? [],
                params: state.params ?? [],
                subcommands: state.subcommands ?? [],
                permissions: state.permissions,
                defaultMemberPermissions: state.defaultMemberPermissions,
                cooldown: state.cooldown,
                execute: state.execute,
            };
        },
    };
}
function makePrefixBuilder(state) {
    return {
        setDescription(desc) {
            return makePrefixBuilder({ ...state, description: desc });
        },
        setCategory(category) {
            return makePrefixBuilder({ ...state, category });
        },
        addAlias(alias) {
            return makePrefixBuilder({ ...state, aliases: [...(state.aliases ?? []), alias] });
        },
        addExample(example) {
            return makePrefixBuilder({ ...state, examples: [...(state.examples ?? []), example] });
        },
        addParam(name, type, opts) {
            const param = {
                name,
                type,
                required: opts?.required ?? false,
                description: opts?.description,
            };
            return makePrefixBuilder({ ...state, params: [...(state.params ?? []), param] });
        },
        addSubcommand(sub) {
            const built = sub.build();
            return makePrefixBuilder({ ...state, subcommands: [...(state.subcommands ?? []), built] });
        },
        setPermissions(perms) {
            return makePrefixBuilder({ ...state, permissions: perms });
        },
        setOwnerOnly() {
            return makePrefixBuilder({ ...state, permissions: { ...(state.permissions ?? {}), ownerOnly: true } });
        },
        setDevOnly() {
            return makePrefixBuilder({ ...state, permissions: { ...(state.permissions ?? {}), devOnly: true } });
        },
        setCooldown(seconds) {
            return makePrefixBuilder({ ...state, cooldown: seconds });
        },
        setExecute(fn) {
            return makePrefixBuilder({ ...state, execute: fn });
        },
        build() {
            return {
                name: state.name,
                commandType: 'prefix',
                description: state.description,
                category: state.category,
                aliases: state.aliases ?? [],
                examples: state.examples ?? [],
                params: state.params ?? [],
                subcommands: state.subcommands ?? [],
                permissions: state.permissions,
                cooldown: state.cooldown,
                execute: state.execute,
            };
        },
    };
}
function makeSubcommandBuilder(state) {
    return {
        addParam(name, type, opts) {
            const param = {
                name,
                type,
                required: opts?.required ?? false,
                description: opts?.description,
            };
            return makeSubcommandBuilder({ ...state, params: [...(state.params ?? []), param] });
        },
        setPermissions(perms) {
            return makeSubcommandBuilder({ ...state, permissions: perms });
        },
        setCooldown(seconds) {
            return makeSubcommandBuilder({ ...state, cooldown: seconds });
        },
        setExecute(fn) {
            return makeSubcommandBuilder({ ...state, execute: fn });
        },
        build() {
            return {
                name: state.name,
                params: state.params ?? [],
                permissions: state.permissions,
                cooldown: state.cooldown,
                execute: state.execute,
            };
        },
    };
}
function makeButtonBuilder(state) {
    return {
        addParam(name) {
            return makeButtonBuilder({ ...state, params: [...(state.params ?? []), name] });
        },
        setPermissions(perms) {
            return makeButtonBuilder({ ...state, permissions: perms });
        },
        setExecute(fn) {
            return makeButtonBuilder({ ...state, execute: fn });
        },
        build() {
            return {
                customId: state.customId,
                params: state.params ?? [],
                permissions: state.permissions,
                execute: state.execute,
            };
        },
    };
}
function makeModalBuilder(state) {
    return {
        setTitle(title) {
            return makeModalBuilder({ ...state, title });
        },
        addField(name, opts) {
            const field = {
                name,
                style: opts?.style ?? FieldStyle.Short,
                required: opts?.required ?? true,
                minLength: opts?.minLength,
                maxLength: opts?.maxLength,
                placeholder: opts?.placeholder,
                label: opts?.label ?? name,
            };
            return makeModalBuilder({ ...state, fields: [...(state.fields ?? []), field] });
        },
        setPermissions(perms) {
            return makeModalBuilder({ ...state, permissions: perms });
        },
        setExecute(fn) {
            return makeModalBuilder({ ...state, execute: fn });
        },
        create(customId) {
            const rows = (state.fields ?? []).map(field => {
                const input = new TextInputBuilder()
                    .setCustomId(field.name)
                    .setLabel(field.label ?? field.name)
                    .setStyle(field.style === FieldStyle.Paragraph ? TextInputStyle.Paragraph : TextInputStyle.Short)
                    .setRequired(field.required);
                if (field.minLength !== undefined)
                    input.setMinLength(field.minLength);
                if (field.maxLength !== undefined)
                    input.setMaxLength(field.maxLength);
                if (field.placeholder)
                    input.setPlaceholder(field.placeholder);
                return new ActionRowBuilder().addComponents(input);
            });
            return new DiscordModalBuilder()
                .setCustomId(customId ?? state.customId)
                .setTitle(state.title ?? state.customId)
                .addComponents(...rows);
        },
        build() {
            return {
                customId: state.customId,
                title: state.title,
                fields: state.fields ?? [],
                permissions: state.permissions,
                execute: state.execute,
            };
        },
    };
}
function makeSelectBuilder(state) {
    return {
        setPermissions(perms) {
            return makeSelectBuilder({ ...state, permissions: perms });
        },
        setExecute(fn) {
            return makeSelectBuilder({ ...state, execute: fn });
        },
        build() {
            return {
                customId: state.customId,
                selectType: state.selectType,
                permissions: state.permissions,
                execute: state.execute,
            };
        },
    };
}
function makeAutocompleteBuilder(state) {
    return {
        setExecute(fn) {
            return makeAutocompleteBuilder({ ...state, execute: fn });
        },
        build() {
            return {
                commandName: state.commandName,
                optionName: state.optionName,
                execute: state.execute,
            };
        },
    };
}
function makeContextMenuBuilder(state) {
    return {
        setPermissions(perms) {
            return makeContextMenuBuilder({ ...state, permissions: perms });
        },
        setDefaultMemberPermissions(permissions) {
            return makeContextMenuBuilder({ ...state, defaultMemberPermissions: permissions });
        },
        setExecute(fn) {
            return makeContextMenuBuilder({ ...state, execute: fn });
        },
        build() {
            return {
                name: state.name,
                type: state.type,
                permissions: state.permissions,
                defaultMemberPermissions: state.defaultMemberPermissions,
                execute: state.execute,
            };
        },
    };
}
function makeEventBuilder(state) {
    return {
        setOnce() {
            return makeEventBuilder({ ...state, once: true });
        },
        setExecute(fn) {
            return makeEventBuilder({ ...state, execute: fn });
        },
        build() {
            return {
                name: state.name,
                once: state.once ?? false,
                execute: state.execute,
            };
        },
    };
}
// ─── Public API ───────────────────────────────────────────────────────────────
export function createSlashCommand(name) {
    return makeSlashBuilder({ name, commandType: 'slash', params: [], subcommands: [] });
}
export function createPrefixCommand(name) {
    return makePrefixBuilder({ name, commandType: 'prefix', params: [], subcommands: [] });
}
export function createSubcommand(name) {
    return makeSubcommandBuilder({ name, params: [] });
}
export function createButton(customId) {
    return makeButtonBuilder({ customId, params: [] });
}
export function createModal(customId) {
    return makeModalBuilder({ customId, fields: [] });
}
export function createSelect(customId, opts) {
    return makeSelectBuilder({ customId, selectType: opts.type });
}
export function createEvent(name) {
    return makeEventBuilder({ name, once: false });
}
export function createAutocomplete(commandName, optionName) {
    return makeAutocompleteBuilder({ commandName, optionName });
}
export function createUserContextMenu(name) {
    return makeContextMenuBuilder({ name, type: 'user' });
}
export function createMessageContextMenu(name) {
    return makeContextMenuBuilder({ name, type: 'message' });
}
