# 🤖 FFlag Discord Bot

A powerful Discord bot for managing and tracking Roblox FFlags with modern UI and extensive features.

## ✨ Features

- 🔍 **Flag Management**
  - Check flag details
  - Search flags by keyword
  - Track flag changes
  - Compare flags across platforms

- 📊 **Analysis Tools**
  - Flag patterns analysis
  - Statistics tracking
  - Flag comparisons
  - Historical data

- 🛠️ **Utilities**
  - JSON/TXT file support
  - Format conversion
  - Flag validation
  - Bulk operations

- 👑 **Admin Features**
  - Bot status management
  - Maintenance mode
  - Server management
  - Broadcast system

## 🚀 Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/fflag-discord-bot.git
cd fflag-discord-bot
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file:
```env
DISCORD_TOKEN=your_bot_token_here
OWNER_ID=your_discord_id_here
```

4. Build and start the bot:
```bash
# Development
npm run bot:dev

# Build
npm run bot:build

# Production
npm run bot:start

# Run tests
npm run bot:test

# Create release zip
npm run create-zip

# Prepare release (build + zip)
npm run prepare-release
```

## 📝 Configuration

1. Bot Token:
- Create a new application at [Discord Developer Portal](https://discord.com/developers/applications)
- Create a bot and copy the token
- Add the token to your `.env` file

2. Owner ID:
- Enable Developer Mode in Discord
- Right-click your username and copy ID
- Add the ID to your `.env` file

3. Permissions:
- Bot requires following permissions:
  - Send Messages
  - Embed Links
  - Attach Files
  - Use Slash Commands
  - Read Message History
  - Add Reactions

## 💻 Commands

Use `/help` to see all available commands, organized in categories:

- ⚡ **Core Commands**
  - `/checkflag` - Look up specific flag details
  - `/findflag` - Search for flags
  - `/newfflags` - Browse recent changes

- 📊 **Analysis Tools**
  - `/analyzeflags` - Analyze patterns
  - `/flagstats` - View statistics
  - `/compareflags` - Compare flags

- 🔧 **Management**
  - `/flaggroups` - Manage flag collections
  - `/checklist` - Validate flag lists

- 📥 **Tracking & Export**
  - `/trackflag` - Track flag changes
  - `/exportflags` - Export flag data
  - `/subscribealerts` - Set up notifications

- 🛠️ **Utilities**
  - `/convertjson` - Convert formats
  - `/flaghistory` - View history

## 🎨 Features

- Modern UI with emojis and interactive components
- Platform-specific flag handling
- Rich flag descriptions and categorization
- Easy-to-use dropdowns and buttons
- Copy functionality for flag values
- Detailed help system with categories

## 📦 Dependencies

- discord.js
- typescript
- axios
- dotenv
- Other dependencies in package.json

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
