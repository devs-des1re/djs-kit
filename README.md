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

## CLI Tools

Once your project is scaffolded, `djs-kit` comes with powerful generators to create new features instantly. Run these from anywhere inside your project directory!

### Add Commands
Generates a new Slash or Prefix command boilerplate.
```bash
npx @devs-des1re/djs-kit add command <name> [--type slash|prefix]
```
*(Tip: You can use paths like `admin/ban` to auto-organize into folders!)*

### Add Components
Generates interactive components with built-in State Serialization handling.
```bash
npx @devs-des1re/djs-kit add button <name>
npx @devs-des1re/djs-kit add modal <name>
npx @devs-des1re/djs-kit add select <name>
```

## State Serialization

Managing component state in discord.js usually requires caching IDs to a database. `djs-kit` solves this elegantly via the `.addParam()` API:

```typescript
// Define what data the button expects
export default createButton('confirm_ban')
  .addParam('targetId')
  .setExecute(async (interaction, args) => {
    // `args.targetId` is extracted automatically!
    await interaction.reply({ content: `Banned <@${args.targetId}>` });
  });
```

## Documentation

The full documentation site contains comprehensive guides on writing commands, structuring your project, and deep dives into the Builder APIs.

---

<div align="center">
  <i>Built for the Discord.js community.</i>
</div>
