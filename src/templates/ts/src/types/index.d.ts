import { Collection } from 'discord.js';
import type { CommandDescriptor, ButtonDescriptor, ModalDescriptor, SelectDescriptor, AutocompleteDescriptor, ContextMenuDescriptor } from '../builders/index.js';

declare module 'discord.js' {
  interface Client {
    slashCommands: Collection<string, CommandDescriptor>;
    prefixCommands: Collection<string, CommandDescriptor>;
    buttons: Collection<string, ButtonDescriptor>;
    modals: Collection<string, ModalDescriptor>;
    selects: Collection<string, SelectDescriptor>;
    autocompleteHandlers: Collection<string, AutocompleteDescriptor>;
    contextMenus: Collection<string, ContextMenuDescriptor>;
  }
}
