import type {
  ChatInputCommandInteraction,
  ClientEvents,
  AutocompleteInteraction,
  ContextMenuCommandInteraction,
  Message,
  PermissionResolvable,
  GuildMember,
  User,
  Role,
  GuildBasedChannel,
  GuildTextBasedChannel,
  ButtonInteraction,
  ModalSubmitInteraction,
  StringSelectMenuInteraction,
  UserSelectMenuInteraction,
  RoleSelectMenuInteraction,
  ChannelSelectMenuInteraction,
  MentionableSelectMenuInteraction,
  Message as DiscordMessage,
} from 'discord.js';
import { ActionRowBuilder, ModalBuilder as DiscordModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';
import { ParamType, FieldStyle, SelectType } from './types.js';

// ─── Internal descriptor shapes (consumed by handlers) ───────────────────────

export interface ParamDescriptor {
  name: string;
  type: ParamType;
  required: boolean;
  description?: string;
  choices?: string[];
  autocomplete?: boolean;
}

export interface SubcommandDescriptor {
  name: string;
  params: ParamDescriptor[];
  permissions?: PermissionConfig;
  cooldown?: number;
  execute?: (interaction: ChatInputCommandInteraction | Message, args: Record<string, unknown>) => Promise<void>;
}

export interface CommandDescriptor {
  name: string;
  commandType: 'slash' | 'prefix';
  description?: string;
  category?: string;
  aliases: string[];
  examples: string[];
  params: ParamDescriptor[];
  subcommands: SubcommandDescriptor[];
  permissions?: PermissionConfig;
  defaultMemberPermissions?: PermissionResolvable;
  cooldown?: number;
  execute?: (interaction: any, args: Record<string, unknown>) => Promise<void>;
}

export interface ButtonDescriptor {
  customId: string;
  params: string[];
  permissions?: PermissionConfig;
  execute?: (interaction: ButtonInteraction, params: Record<string, string>) => Promise<void>;
}

export interface FieldDescriptor {
  name: string;
  style: FieldStyle;
  required: boolean;
  minLength?: number;
  maxLength?: number;
  placeholder?: string;
  label?: string;
}

export interface ModalDescriptor {
  customId: string;
  title?: string;
  fields: FieldDescriptor[];
  permissions?: PermissionConfig;
  execute?: (interaction: ModalSubmitInteraction, fields: Record<string, string | undefined>) => Promise<void>;
}

export type SelectInteraction =
  | StringSelectMenuInteraction
  | UserSelectMenuInteraction
  | RoleSelectMenuInteraction
  | ChannelSelectMenuInteraction
  | MentionableSelectMenuInteraction;

export interface SelectDescriptor {
  customId: string;
  selectType: SelectType;
  permissions?: PermissionConfig;
  execute?: (interaction: SelectInteraction, values: unknown[]) => Promise<void>;
}

export interface AutocompleteDescriptor {
  commandName: string;
  optionName: string;
  execute?: (interaction: AutocompleteInteraction) => Promise<void>;
}

export interface ContextMenuDescriptor {
  name: string;
  type: 'user' | 'message';
  permissions?: PermissionConfig;
  defaultMemberPermissions?: PermissionResolvable;
  execute?: (interaction: ContextMenuCommandInteraction, target: User | DiscordMessage) => Promise<void>;
}

export interface EventDescriptor<K extends keyof ClientEvents = keyof ClientEvents> {
  name: K;
  once: boolean;
  execute?: (...args: ClientEvents[K]) => Promise<void>;
}

export interface PermissionConfig {
  allowedRoles?: string[];
  allowedUsers?: string[];
  blacklistedRoles?: string[];
  blacklistedUsers?: string[];
  ownerOnly?: boolean;
  devOnly?: boolean;
}

// ─── Type maps ────────────────────────────────────────────────────────────────

type ParamTypeMap = {
  [ParamType.User]: User;
  [ParamType.Member]: GuildMember;
  [ParamType.Channel]: GuildBasedChannel;
  [ParamType.TextChannel]: GuildTextBasedChannel;
  [ParamType.Role]: Role;
  [ParamType.Number]: number;
  [ParamType.String]: string;
  [ParamType.Boolean]: boolean;
};

interface ParamOptions {
  required?: boolean;
  description?: string;
  choices?: string[];
  autocomplete?: boolean;
}

type ResolvedParam<T extends ParamType, O extends ParamOptions | undefined> =
  O extends { required: true } ? ParamTypeMap[T] : ParamTypeMap[T] | undefined;

interface FieldOptions {
  style?: FieldStyle;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  placeholder?: string;
  label?: string;
}

type ResolvedField<O extends FieldOptions | undefined> =
  O extends { required: true } ? string : string | undefined;

// ─── Slash Command Builder ─────────────────────────────────────────────────────

type SlashExecuteFn<TArgs> = (
  interaction: ChatInputCommandInteraction,
  args: TArgs
) => Promise<void>;

export interface SlashCommandBuilder<TArgs extends Record<string, unknown>> {
  setDescription(desc: string): SlashCommandBuilder<TArgs>;
  setCategory(category: string): SlashCommandBuilder<TArgs>;
  addExample(example: string): SlashCommandBuilder<TArgs>;
  addParam<K extends string, T extends ParamType, O extends ParamOptions>(
    name: K,
    type: T,
    opts?: O
  ): SlashCommandBuilder<TArgs & { [P in K]: ResolvedParam<T, O> }>;
  addSubcommand(sub: SubcommandBuilderResult): SlashCommandBuilder<TArgs>;
  setPermissions(perms: PermissionConfig): SlashCommandBuilder<TArgs>;
  setDefaultMemberPermissions(permissions: PermissionResolvable): SlashCommandBuilder<TArgs>;
  setOwnerOnly(): SlashCommandBuilder<TArgs>;
  setDevOnly(): SlashCommandBuilder<TArgs>;
  setCooldown(seconds: number): SlashCommandBuilder<TArgs>;
  setExecute(fn: SlashExecuteFn<TArgs & { _raw?: undefined }>): SlashCommandBuilder<TArgs>;
  build(): CommandDescriptor;
}

function makeSlashBuilder<TArgs extends Record<string, unknown>>(
  state: Partial<CommandDescriptor> & { commandType: 'slash' }
): SlashCommandBuilder<TArgs> {
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
      const param: ParamDescriptor = {
        name,
        type,
        required: opts?.required ?? false,
        description: opts?.description,
        choices: (opts as any)?.choices,
        autocomplete: opts?.autocomplete,
      };
      return makeSlashBuilder({ ...state, params: [...(state.params ?? []), param] }) as any;
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
      return makeSlashBuilder({ ...state, execute: fn as any });
    },
    build(): CommandDescriptor {
      return {
        name: state.name!,
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

// ─── Prefix Command Builder ────────────────────────────────────────────────────

type PrefixExecuteFn<TArgs> = (
  message: Message<true>,
  args: TArgs & { _raw: string; _rest: string[] }
) => Promise<void>;

export interface PrefixCommandBuilder<TArgs extends Record<string, unknown>> {
  setDescription(desc: string): PrefixCommandBuilder<TArgs>;
  setCategory(category: string): PrefixCommandBuilder<TArgs>;
  addAlias(alias: string): PrefixCommandBuilder<TArgs>;
  addExample(example: string): PrefixCommandBuilder<TArgs>;
  addParam<K extends string, T extends ParamType, O extends ParamOptions>(
    name: K,
    type: T,
    opts?: O
  ): PrefixCommandBuilder<TArgs & { [P in K]: ResolvedParam<T, O> }>;
  addSubcommand(sub: SubcommandBuilderResult): PrefixCommandBuilder<TArgs>;
  setPermissions(perms: PermissionConfig): PrefixCommandBuilder<TArgs>;
  setOwnerOnly(): PrefixCommandBuilder<TArgs>;
  setDevOnly(): PrefixCommandBuilder<TArgs>;
  setCooldown(seconds: number): PrefixCommandBuilder<TArgs>;
  setExecute(
    fn: PrefixExecuteFn<TArgs>
  ): PrefixCommandBuilder<TArgs>;
  build(): CommandDescriptor;
}

function makePrefixBuilder<TArgs extends Record<string, unknown>>(
  state: Partial<CommandDescriptor> & { commandType: 'prefix' }
): PrefixCommandBuilder<TArgs> {
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
      const param: ParamDescriptor = {
        name,
        type,
        required: opts?.required ?? false,
        description: opts?.description,
      };
      return makePrefixBuilder({ ...state, params: [...(state.params ?? []), param] }) as any;
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
      return makePrefixBuilder({ ...state, execute: fn as any });
    },
    build(): CommandDescriptor {
      return {
        name: state.name!,
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

// ─── Subcommand Builder ───────────────────────────────────────────────────────

export interface SubcommandBuilder<TArgs extends Record<string, unknown>> {
  addParam<K extends string, T extends ParamType, O extends ParamOptions>(
    name: K,
    type: T,
    opts?: O
  ): SubcommandBuilder<TArgs & { [P in K]: ResolvedParam<T, O> }>;
  setPermissions(perms: PermissionConfig): SubcommandBuilder<TArgs>;
  setCooldown(seconds: number): SubcommandBuilder<TArgs>;
  setExecute(fn: (interaction: ChatInputCommandInteraction | Message<true>, args: TArgs & Partial<{ _raw: string; _rest: string[] }>) => Promise<void>): SubcommandBuilder<TArgs>;
  build(): SubcommandDescriptor;
}

export type SubcommandBuilderResult = SubcommandBuilder<Record<string, unknown>>;

function makeSubcommandBuilder<TArgs extends Record<string, unknown>>(
  state: Partial<SubcommandDescriptor>
): SubcommandBuilder<TArgs> {
  return {
    addParam(name, type, opts) {
      const param: ParamDescriptor = {
        name,
        type,
        required: opts?.required ?? false,
        description: opts?.description,
      };
      return makeSubcommandBuilder({ ...state, params: [...(state.params ?? []), param] }) as any;
    },
    setPermissions(perms) {
      return makeSubcommandBuilder({ ...state, permissions: perms });
    },
    setCooldown(seconds) {
      return makeSubcommandBuilder({ ...state, cooldown: seconds });
    },
    setExecute(fn) {
      return makeSubcommandBuilder({ ...state, execute: fn as any });
    },
    build(): SubcommandDescriptor {
      return {
        name: state.name!,
        params: state.params ?? [],
        permissions: state.permissions,
        cooldown: state.cooldown,
        execute: state.execute,
      };
    },
  };
}

// ─── Button Builder ───────────────────────────────────────────────────────────

type ButtonExecuteFn<TParams> = (
  interaction: ButtonInteraction,
  params: TParams
) => Promise<void>;

export interface ButtonBuilder<TParams extends Record<string, string>> {
  addParam<K extends string>(name: K): ButtonBuilder<TParams & { [P in K]: string }>;
  setPermissions(perms: PermissionConfig): ButtonBuilder<TParams>;
  setExecute(fn: ButtonExecuteFn<TParams>): ButtonBuilder<TParams>;
  build(): ButtonDescriptor;
}

function makeButtonBuilder<TParams extends Record<string, string>>(
  state: Partial<ButtonDescriptor>
): ButtonBuilder<TParams> {
  return {
    addParam(name) {
      return makeButtonBuilder({ ...state, params: [...(state.params ?? []), name] }) as any;
    },
    setPermissions(perms) {
      return makeButtonBuilder({ ...state, permissions: perms });
    },
    setExecute(fn) {
      return makeButtonBuilder({ ...state, execute: fn as any });
    },
    build(): ButtonDescriptor {
      return {
        customId: state.customId!,
        params: state.params ?? [],
        permissions: state.permissions,
        execute: state.execute,
      };
    },
  };
}

// ─── Modal Builder ────────────────────────────────────────────────────────────

type ModalExecuteFn<TFields> = (
  interaction: ModalSubmitInteraction,
  fields: TFields
) => Promise<void>;

export interface ModalBuilder<TFields extends Record<string, string | undefined>> {
  setTitle(title: string): ModalBuilder<TFields>;
  addField<K extends string, O extends FieldOptions>(
    name: K,
    opts?: O
  ): ModalBuilder<TFields & { [P in K]: ResolvedField<O> }>;
  setPermissions(perms: PermissionConfig): ModalBuilder<TFields>;
  setExecute(fn: ModalExecuteFn<TFields>): ModalBuilder<TFields>;
  create(customId?: string): DiscordModalBuilder;
  build(): ModalDescriptor;
}

function makeModalBuilder<TFields extends Record<string, string | undefined>>(
  state: Partial<ModalDescriptor>
): ModalBuilder<TFields> {
  return {
    setTitle(title) {
      return makeModalBuilder({ ...state, title });
    },
    addField(name, opts) {
      const field: FieldDescriptor = {
        name,
        style: opts?.style ?? FieldStyle.Short,
        required: opts?.required ?? true,
        minLength: opts?.minLength,
        maxLength: opts?.maxLength,
        placeholder: opts?.placeholder,
        label: opts?.label ?? name,
      };
      return makeModalBuilder({ ...state, fields: [...(state.fields ?? []), field] }) as any;
    },
    setPermissions(perms) {
      return makeModalBuilder({ ...state, permissions: perms });
    },
    setExecute(fn) {
      return makeModalBuilder({ ...state, execute: fn as any });
    },
    create(customId) {
      const rows = (state.fields ?? []).map(field => {
        const input = new TextInputBuilder()
          .setCustomId(field.name)
          .setLabel(field.label ?? field.name)
          .setStyle(field.style === FieldStyle.Paragraph ? TextInputStyle.Paragraph : TextInputStyle.Short)
          .setRequired(field.required);

        if (field.minLength !== undefined) input.setMinLength(field.minLength);
        if (field.maxLength !== undefined) input.setMaxLength(field.maxLength);
        if (field.placeholder) input.setPlaceholder(field.placeholder);

        return new ActionRowBuilder<TextInputBuilder>().addComponents(input);
      });

      return new DiscordModalBuilder()
        .setCustomId(customId ?? state.customId!)
        .setTitle(state.title ?? state.customId!)
        .addComponents(...rows);
    },
    build(): ModalDescriptor {
      return {
        customId: state.customId!,
        title: state.title,
        fields: state.fields ?? [],
        permissions: state.permissions,
        execute: state.execute,
      };
    },
  };
}

// ─── Select Builder ───────────────────────────────────────────────────────────

type SelectValueMap = {
  [SelectType.String]: string;
  [SelectType.User]: User;
  [SelectType.Role]: Role;
  [SelectType.Channel]: GuildBasedChannel;
  [SelectType.Mentionable]: User | Role;
};

export interface SelectBuilder<T extends SelectType = SelectType> {
  setPermissions(perms: PermissionConfig): SelectBuilder<T>;
  setExecute(fn: (interaction: SelectInteraction, values: SelectValueMap[T][]) => Promise<void>): SelectBuilder<T>;
  build(): SelectDescriptor;
}

function makeSelectBuilder<T extends SelectType>(state: Partial<SelectDescriptor> & { selectType: T }): SelectBuilder<T> {
  return {
    setPermissions(perms) {
      return makeSelectBuilder({ ...state, permissions: perms });
    },
    setExecute(fn) {
      return makeSelectBuilder({ ...state, execute: fn as SelectDescriptor['execute'] });
    },
    build(): SelectDescriptor {
      return {
        customId: state.customId!,
        selectType: state.selectType!,
        permissions: state.permissions,
        execute: state.execute,
      };
    },
  };
}

// ─── Autocomplete Builder ────────────────────────────────────────────────────

export interface AutocompleteBuilder {
  setExecute(fn: (interaction: AutocompleteInteraction) => Promise<void>): AutocompleteBuilder;
  build(): AutocompleteDescriptor;
}

function makeAutocompleteBuilder(state: Partial<AutocompleteDescriptor> & { commandName: string; optionName: string }): AutocompleteBuilder {
  return {
    setExecute(fn) {
      return makeAutocompleteBuilder({ ...state, execute: fn });
    },
    build(): AutocompleteDescriptor {
      return {
        commandName: state.commandName,
        optionName: state.optionName,
        execute: state.execute,
      };
    },
  };
}

// ─── Context Menu Builder ────────────────────────────────────────────────────

export interface ContextMenuBuilder {
  setPermissions(perms: PermissionConfig): ContextMenuBuilder;
  setDefaultMemberPermissions(permissions: PermissionResolvable): ContextMenuBuilder;
  setExecute(fn: (interaction: ContextMenuCommandInteraction, target: User | DiscordMessage) => Promise<void>): ContextMenuBuilder;
  build(): ContextMenuDescriptor;
}

function makeContextMenuBuilder(state: Partial<ContextMenuDescriptor> & { name: string; type: 'user' | 'message' }): ContextMenuBuilder {
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
    build(): ContextMenuDescriptor {
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

// ─── Event Builder ────────────────────────────────────────────────────────────

export interface EventBuilder<K extends keyof ClientEvents> {
  setOnce(): EventBuilder<K>;
  setExecute(fn: (...args: ClientEvents[K]) => Promise<void>): EventBuilder<K>;
  build(): EventDescriptor<K>;
}

function makeEventBuilder<K extends keyof ClientEvents>(
  state: Partial<EventDescriptor<K>> & { name: K }
): EventBuilder<K> {
  return {
    setOnce() {
      return makeEventBuilder({ ...state, once: true });
    },
    setExecute(fn) {
      return makeEventBuilder({ ...state, execute: fn });
    },
    build(): EventDescriptor<K> {
      return {
        name: state.name,
        once: state.once ?? false,
        execute: state.execute,
      };
    },
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function createSlashCommand(name: string): SlashCommandBuilder<Record<never, never>> {
  return makeSlashBuilder({ name, commandType: 'slash', params: [], subcommands: [] });
}

export function createPrefixCommand(name: string): PrefixCommandBuilder<Record<never, never>> {
  return makePrefixBuilder({ name, commandType: 'prefix', params: [], subcommands: [] });
}

export function createSubcommand(name: string): SubcommandBuilderResult {
  return makeSubcommandBuilder({ name, params: [] });
}

export function createButton(customId: string): ButtonBuilder<Record<never, never>> {
  return makeButtonBuilder({ customId, params: [] });
}

export function createModal(customId: string): ModalBuilder<Record<never, never>> {
  return makeModalBuilder({ customId, fields: [] });
}

export function createSelect(
  customId: string,
  opts: { type: SelectType }
): SelectBuilder<typeof opts.type> {
  return makeSelectBuilder({ customId, selectType: opts.type });
}

export function createEvent<K extends keyof ClientEvents>(name: K): EventBuilder<K> {
  return makeEventBuilder({ name, once: false });
}

export function createAutocomplete(commandName: string, optionName: string): AutocompleteBuilder {
  return makeAutocompleteBuilder({ commandName, optionName });
}

export function createUserContextMenu(name: string): ContextMenuBuilder {
  return makeContextMenuBuilder({ name, type: 'user' });
}

export function createMessageContextMenu(name: string): ContextMenuBuilder {
  return makeContextMenuBuilder({ name, type: 'message' });
}
