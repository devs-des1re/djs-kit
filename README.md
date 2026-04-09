# @devs_des1re/djs-kit

A command-line interface tool for creating Discord.js v14 bots with a complete project structure, permission system, and MongoDB integration.

## Badges

![Version](https://img.shields.io/npm/v/@devs_des1re/djs-kit)
![Downloads](https://img.shields.io/npm/dm/@devs_des1re/djs-kit)
![License](https://img.shields.io/npm/l/@devs_des1re/djs-kit)
![Node Version](https://img.shields.io/node/v/@devs_des1re/djs-kit)
![Discord.js Version](https://img.shields.io/badge/discord.js-v14.26.2-blue)
![Build Status](https://img.shields.io/github/actions/workflow/status/devs-des1re/djs-kit/ci.yml)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen)

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Usage](#usage)
- [Data](#data)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## Overview

@devs_des1re/djs-kit is a scaffolding tool that generates a production-ready Discord.js bot project. It creates an organized codebase with support for slash commands, prefix commands, buttons, select menus, modals, and MongoDB database integration. The generated bot includes a built-in permission system that allows you to restrict commands to specific roles or users.

## Features

**Complete Discord.js v14 Support**
The generated bot uses Discord.js v14 with full support for all modern Discord features including slash commands, buttons, select menus, modals, and context menus.

**Modular Architecture**
The project structure separates components into dedicated folders for commands, events, buttons, dropdowns, modals, and utilities, making the codebase easy to maintain and scale.

**Permission System**
Every command and interaction can be restricted to specific Discord roles or users using simple arrays in the command configuration.

**Database Integration**
MongoDB with Mongoose ODM is pre-configured and ready to use. The connection is established automatically when the bot starts.

**Multiple Package Manager Support**
The CLI works with npm, yarn, pnpm, and bun. Choose your preferred package manager during setup.

## Installation

### Global Installation

```bash
npm install -g @devs_des1re/djs-kit
```

### Using npx (No Installation Required)

```bash
npx @devs_des1re/djs-kit create
```

### Verifying Installation

```bash
djs-kit --version
```

## Quick Start

Create your first Discord bot in four commands:

```bash
npx @devs_des1re/djs-kit create
cd djs-kit
npm run deploy
npm start
```

## Usage

### Interactive Mode

```bash
djs-kit create
```

You will be prompted for:
- Bot name (use . for current directory)
- Description
- Discord Bot Token
- Discord Client ID
- Discord Guild ID
- MongoDB URI
- Package manager (npm, yarn, pnpm, bun)
- Install dependencies (yes/no)

### Non-Interactive Mode

```bash
djs-kit create --yes
```

### Custom Output Directory

```bash
djs-kit create --output ./my-projects
```

### Command Help

```bash
djs-kit create --help
```

## Data

The generated bot uses configuration properties in each command and interaction file to control behavior and permissions.

### disabled

The disabled property determines whether a command or interaction handler is active.

When set to false, the command is enabled and available for use. This is the default setting.

When set to true, the command is disabled and will not be loaded into the bot or executable by users.

This property is useful for temporarily disabling commands without deleting the file, deprecating old commands while keeping the code for reference, or disabling commands during maintenance or testing.

### roles

The roles property restricts command usage to specific Discord role IDs. Users must have at least one of the specified roles to use the command.

When an empty array is provided, there are no role restrictions and anyone can use the command. This is the default setting.

When an array of role IDs is provided, only users who have at least one of those roles can execute the command.

To get a role ID, enable Developer Mode in Discord settings, then right-click on a role in server settings and click Copy ID.

### users

The users property restricts command usage to specific Discord user IDs. Only the specified users can use the command.

When an empty array is provided, there are no user restrictions and anyone can use the command. This is the default setting.

When an array of user IDs is provided, only the specified users can execute the command.

To get a user ID, enable Developer Mode in Discord settings, then right-click on any user and click Copy ID.

### Combined Restrictions

When both roles and users arrays are provided with values, the user must satisfy both conditions. They must have at least one of the specified roles and also be one of the specified users.

When roles is empty and users has values, only the specified users can use the command with no role requirements.

When users is empty and roles has values, only users with the specified roles can use the command with no user restrictions.

When both arrays are empty, anyone can use the command with no restrictions.

### Permission Hierarchy

The permission system checks roles first, then users. If a command has both restrictions, the user must pass both checks. If a user fails either check, they receive a permission denied message.

Commands that are disabled take precedence over permission checks. A disabled command will not be loaded at all, regardless of the user's roles or user ID.

## Troubleshooting

### Bot Doesn't Start

Verify that all required environment variables are set in the .env file. Ensure your Discord token is valid and the bot has the required intents enabled in the Discord Developer Portal.

### Commands Not Appearing

Run npm run deploy to register slash commands with Discord. For guild commands, verify the DISCORD_GUILD_ID is correct. Global commands can take up to an hour to propagate.

### Permission Errors

Ensure the bot has the necessary permissions in your Discord server including Send Messages, Embed Links, Use Slash Commands, Read Message History, and for moderation commands, Manage Messages.

### MongoDB Connection Errors

Verify the MONGODB_URI is correct. The bot will continue running even without a database connection, but features that require the database will not work.

## Contributing

Contributions are welcome. Please open an issue or submit a pull request on GitHub.

## License

This project is licensed under the MIT License.