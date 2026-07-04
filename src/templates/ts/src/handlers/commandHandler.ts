import { Events, type Client } from 'discord.js';
import { config } from '../config.js';
import { checkPermissions } from '../lib/permissions.js';
import { createCooldownStore } from '../lib/cooldowns.js';
import { parseArgs } from '../lib/argParser.js';

const cooldowns = createCooldownStore(config.cooldownBackend);

export function registerCommandHandler(client: Client): void {
  // --- SLASH COMMANDS ---
  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    if (!interaction.inGuild()) return;

    const desc = client.slashCommands.get(interaction.commandName);
    if (!desc) return;

    try {
      const member = await interaction.guild?.members.fetch(interaction.user.id);
      if (member) {
        const permCheck = checkPermissions(member, desc.permissions);
        if (!permCheck.allowed) {
          await interaction.reply({ content: `You don't have permission to use this command. (${permCheck.reason})`, ephemeral: true });
          return;
        }
      }

      if (desc.cooldown) {
        const msLeft = await cooldowns.check(desc.name, interaction.user.id);
        if (msLeft) {
          await interaction.reply({ content: `Please wait ${(msLeft / 1000).toFixed(1)}s before using this command again.`, ephemeral: true });
          return;
        }
        await cooldowns.set(desc.name, interaction.user.id, desc.cooldown * 1000);
      }

      const args: Record<string, unknown> = {};
      for (const param of desc.params) {
        let val: unknown = null;
        if (param.type === 'string') val = interaction.options.getString(param.name);
        else if (param.type === 'number') val = interaction.options.getNumber(param.name);
        else if (param.type === 'boolean') val = interaction.options.getBoolean(param.name);
        else if (param.type === 'user') val = interaction.options.getUser(param.name);
        else if (param.type === 'member') val = interaction.options.getMember(param.name);
        else if (param.type === 'channel' || param.type === 'textChannel') {
          const ch = interaction.options.getChannel(param.name);
          val = ch ? (interaction.guild?.channels.cache.get(ch.id) ?? ch) : null;
        }
        else if (param.type === 'role') val = interaction.options.getRole(param.name);
        
        args[param.name] = val;
      }

      if (desc.execute) {
        await desc.execute(interaction, args);
      } else {
        await interaction.reply({ content: 'Command logic not implemented.', ephemeral: true });
      }
    } catch (err) {
      console.error(`Error executing slash command ${desc.name}:`, err);
      const msg = { content: 'There was an error while executing this command!', ephemeral: true };
      if (interaction.replied || interaction.deferred) await interaction.followUp(msg).catch(() => {});
      else await interaction.reply(msg).catch(() => {});
    }
  });

  // --- PREFIX COMMANDS ---
  client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot || !message.guild) return;
    if (!message.content.startsWith(config.prefix)) return;

    const args = message.content.slice(config.prefix.length).trim().split(/ +/);
    const commandName = args.shift()?.toLowerCase();
    if (!commandName) return;

    const parentDesc = client.prefixCommands.get(commandName);
    if (!parentDesc) return;

    try {
      let desc = parentDesc;
      let usedSubcommand = false;

      if (parentDesc.subcommands.length > 0 && args.length > 0) {
        const subName = args[0].toLowerCase();
        const sub = parentDesc.subcommands.find(s => s.name === subName);
        if (sub) {
          desc = { ...parentDesc, ...sub, permissions: sub.permissions ?? parentDesc.permissions };
          args.shift(); // remove subcommand name
          usedSubcommand = true;
        }
      }

      const permCheck = checkPermissions(message.member!, desc.permissions);
      if (!permCheck.allowed) {
        await message.reply(`You don't have permission to use this command. (${permCheck.reason})`);
        return;
      }

      if (desc.cooldown) {
        const key = usedSubcommand ? `${desc.name}.${args[0]}` : desc.name; // approx for subcmd key
        const msLeft = await cooldowns.check(key, message.author.id);
        if (msLeft) {
          await message.reply(`Please wait ${(msLeft / 1000).toFixed(1)}s before using this command again.`);
          return;
        }
        await cooldowns.set(key, message.author.id, desc.cooldown * 1000);
      }

      const consumedTokens = usedSubcommand ? 2 : 1;
      const resolvedArgs = await parseArgs(message, args, desc.params, message.guild!, consumedTokens);
      if (!resolvedArgs) return; // Error handled inside parseArgs

      if (desc.execute) {
        await desc.execute(message as any, resolvedArgs);
      } else {
        await message.reply('Command logic not implemented.');
      }
    } catch (err) {
      console.error(`Error executing prefix command ${parentDesc.name}:`, err);
      await message.reply('There was an error while executing this command!').catch(() => {});
    }
  });
}
