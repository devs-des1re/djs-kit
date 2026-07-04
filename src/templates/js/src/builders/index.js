import { ParamType, FieldStyle } from './types.js';
function makeSlashBuilder(state) {
    return {
        setDescription(desc) {
            return makeSlashBuilder({ ...state, description: desc });
        },
        addParam(name, type, opts) {
            const param = {
                name,
                type,
                required: opts?.required ?? false,
                description: opts?.description,
                choices: opts?.choices,
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
                params: state.params ?? [],
                subcommands: state.subcommands ?? [],
                permissions: state.permissions,
                cooldown: state.cooldown,
                execute: state.execute,
            };
        },
    };
}
function makePrefixBuilder(state) {
    return {
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
