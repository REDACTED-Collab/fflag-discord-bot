import { Client, Collection, Events, GatewayIntentBits, REST, Routes, ChatInputCommandInteraction } from 'discord.js';
import { config } from './config';
import { commands, Command } from './commands';

declare module 'discord.js' {
    export interface Client {
        commands: Collection<string, Command>;
    }
}

if (!config.DISCORD_TOKEN) {
    console.error('No Discord token provided! Please set DISCORD_TOKEN in your environment.');
    process.exit(1);
}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages
    ]
});

// Initialize commands collection
client.commands = new Collection();

// Register commands
for (const command of commands) {
    if (command.data.name) {
        client.commands.set(command.data.name, command);
    }
}

client.once(Events.ClientReady, (readyClient) => {
    console.log(`🤖 Bot is online as ${readyClient.user.tag}`);
    void deployCommands(readyClient.user.id);
});

// Handle slash commands
client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(`Error executing ${interaction.commandName}:`, error);
        
        // Provide helpful error messages based on the error type
        let errorMessage = '❌ There was an error executing this command.';
        let suggestion = '';

        if (error instanceof Error) {
            if (error.message.includes('rate limit')) {
                errorMessage = '⏳ You\'re using commands too quickly.';
                suggestion = 'Please wait a moment before trying again.';
            } else if (error.message.includes('permission')) {
                errorMessage = '🔒 The bot lacks required permissions.';
                suggestion = 'Make sure the bot has proper permissions in this channel.';
            } else if (error.message.includes('not found')) {
                errorMessage = '❓ The requested flag or resource was not found.';
                suggestion = 'Check the spelling or try searching with /findflag first.';
            } else if (error.message.includes('timeout')) {
                errorMessage = '⌛ The request timed out.';
                suggestion = 'The service might be temporarily slow. Try again in a moment.';
            } else if (error.message.includes('invalid')) {
                errorMessage = '⚠️ Invalid input provided.';
                suggestion = 'Use /help <command> to see the correct usage.';
            }
        }

        const response = {
            content: `${errorMessage}\n${suggestion ? `💡 Suggestion: ${suggestion}` : ''}`,
            ephemeral: true
        };

        if (interaction.replied || interaction.deferred) {
            await interaction.followUp(response);
        } else {
            await interaction.reply(response);
        }
    }
});

// Handle errors
client.on(Events.Error, error => {
    console.error('Discord client error:', error);
});

// Deploy commands
async function deployCommands(clientId: string) {
    try {
        console.log('Started refreshing application (/) commands...');

        const rest = new REST().setToken(config.DISCORD_TOKEN);
        const commandData = commands.map(command => command.data.toJSON());

        console.log(`Registering ${commandData.length} commands:`);
        commandData.forEach(cmd => {
            console.log(`- /${cmd.name}`);
        });

        // Deploy commands globally
        await rest.put(
            Routes.applicationCommands(clientId),
            { body: commandData }
        );
        console.log('Successfully reloaded global commands');

        console.log('Command registration complete!');
    } catch (error) {
        console.error('Error deploying commands:', error);
        if (error instanceof Error) {
            console.error('Error details:', error.message);
        }
    }
}

// Login and start the bot
client.login(config.DISCORD_TOKEN).catch(error => {
    console.error('Error logging in:', error);
    process.exit(1);
});

// Handle process termination
process.on('SIGINT', () => {
    console.log('Bot is shutting down...');
    client.destroy();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('Bot is shutting down...');
    client.destroy();
    process.exit(0);
});

// Handle unhandled rejections
process.on('unhandledRejection', (error) => {
    console.error('Unhandled promise rejection:', error);
});
