<div align="center">
  <img src="https://github.com/devs-des1re/djs-kit/blob/main/docs/public/logo-transparent.png" alt="djs-kit" width="150" />
  <h1>djs-kit</h1>
  <p>The fastest and most robust way to start building modern Discord bots with discord.js v14.</p>
</div>

---

**djs-kit** is a powerful CLI scaffolding tool and framework for [discord.js v14](https://discord.js.org/). It removes all the boilerplate of building a Discord bot from scratch, providing you with a production-ready setup in seconds.

## Features

- **Instant Scaffolding:** Create a fully-functioning bot with interactive prompts.
- **Type-Safe Builders:** Chainable, deeply typed builder APIs for commands and components.
- **Smart State Serialization:** Pass variables between commands and button clicks natively without a database via `.addParam()`.
- **Organized Architecture:** A clean, modular folder structure that scales seamlessly.
- **TypeScript & JavaScript Support:** Choose between strict TS or flexible JS output.
- **Hot Reloading:** Pre-configured with `nodemon` and `tsx` for instant live-reloading during development.
- **Auto Sharding:** Generated bots include `dev:shards` and `start:shards` powered by Discord.js `ShardingManager`.
- **Startup Log Files:** Every bot run writes a fresh file under `logs/` for easier debugging.

## Quick Start

Generate a new project using `npx` directly from your terminal:

```bash
npx @devs-des1re/djs-kit create my-discord-bot
```

The CLI will launch an interactive flow to configure your bot (Output Language, Token Validation, Guild IDs, etc). Once finished, `cd` into your new folder and start coding!

```bash
cd my-discord-bot
npm run dev
```

For auto-sharded development or production starts:

```bash
npm run dev:shards
npm run start:shards
```

## Database Presets

Choose a storage/database preset at scaffold time:

```bash
npx @devs-des1re/djs-kit create my-bot --lang ts --guild-id 123456789012345678 --db postgres
```

Supported presets are `none`, `file`, `sqlite`, `postgres`, `mysql`, `mongo`, and `redis`. SQLite, Postgres, and MySQL generate Drizzle schema/config files plus `db:generate`, `db:migrate`, and `db:studio` scripts.

## Starter Presets

Choose a project preset at scaffold time:

```bash
npx @devs-des1re/djs-kit create my-bot --lang ts --guild-id 123456789012345678 --preset tickets
```

Supported presets are:

- `bare`: empty command/component/event folders
- `utility`: the standard general-purpose starter
- `moderation`: moderation commands and audit-log examples
- `tickets`: ticket command, buttons, and modal examples
- `community`: server info and member join/leave examples

## CLI Tools

Once your project is scaffolded, `djs-kit` comes with powerful generators to create new features instantly. Run these from anywhere inside your project directory!

### Add Commands
Generates a new Slash or Prefix command boilerplate.
```bash
npx @devs-des1re/djs-kit add command <name> [--type slash|prefix]
```
*(Tip: You can use paths like `admin/ban` to auto-organize into folders!)*

Generated projects can run slash-only, prefix-only, or both from `src/config.ts`. Slash commands can be registered to one guild, multiple guilds, or globally.

### Add Components
Generates interactive components with built-in State Serialization handling.
```bash
npx @devs-des1re/djs-kit add button <name>
npx @devs-des1re/djs-kit add modal <name>
npx @devs-des1re/djs-kit add select <name>
```

### Add Events
Generates a Discord event listener boilerplate.
```bash
npx @devs-des1re/djs-kit add event ready
npx @devs-des1re/djs-kit add event guildMemberAdd
```

### Add Advanced Interactions
Generates autocomplete handlers and context menu commands.
```bash
npx @devs-des1re/djs-kit add autocomplete ping style
npx @devs-des1re/djs-kit add context inspectUser --type user
npx @devs-des1re/djs-kit add context quoteMessage --type message
```

### Project Tools
Run these inside a generated djs-kit project:
```bash
npx @devs-des1re/djs-kit doctor
npx @devs-des1re/djs-kit validate
npx @devs-des1re/djs-kit env
npx @devs-des1re/djs-kit sync-commands
npx @devs-des1re/djs-kit upgrade
```

## Signed Component State

Managing component state in discord.js usually requires caching IDs to a database. `djs-kit` solves this with signed compact custom IDs and the `.addParam()` API:

```typescript
// Define what data the button expects
export default createButton('confirm_ban')
  .addParam('targetId')
  .setExecute(async (interaction, args) => {
    // `args.targetId` is extracted automatically!
    await interaction.reply({ content: `Banned <@${args.targetId}>` });
  });
```

When building the button, pass state and optional expiry/scope:

```typescript
buildCustomId('confirm_ban', { targetId }, {
  expiresIn: 300,
  userId: interaction.user.id,
  guildId: interaction.guildId ?? undefined,
});
```

The handler verifies the signature and rejects expired or wrongly scoped component interactions automatically.

## Utility Helpers

Generated projects include reusable helpers in `src/lib` for common bot work:

- Safe interaction responses: `safeReply`, `safeEdit`, `safeDefer`, `safeEphemeral`
- Embed presets: `infoEmbed`, `successEmbed`, `warningEmbed`, `errorEmbed`
- Button pagination: `paginate`
- Confirmation prompts: `askForConfirmation`
- Guards: `guildOnly`, `ownerOnly`, `requireUserPermissions`, `requireBotPermissions`
- Logging/audit helpers: `sendLog`, `sendModerationAudit`
- Per-start log files in `logs/`

## Documentation

The documentation site contains focused guides for the full generated stack:

- CLI usage, project tools, and generators
- Slash, prefix, autocomplete, and context menu commands
- Event loading and runtime safety
- Buttons, modals, select menus, signed custom IDs, and expirations
- Database presets, including SQLite/Postgres/MySQL with Drizzle
- Deployment, permissions, project presets, examples, and migration notes

Start with `docs/content/docs/index.mdx` if you are editing the docs locally.

---

<div align="center">
  <i>Built for the Discord.js community.</i>
</div>
