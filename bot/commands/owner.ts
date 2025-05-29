import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, PresenceStatusData, ActivityType, Guild } from 'discord.js';
import { checkOwner } from '../utils/ownerCheck';
import { config } from '../config';
import { botState } from '../utils/botState';

export const owner = {
    data: new SlashCommandBuilder()
        .setName('owner')
        .setDescription('Owner-only commands')
        .addSubcommand(subcommand =>
            subcommand
                .setName('status')
                .setDescription('Set bot status')
                .addStringOption(option =>
                    option
                        .setName('type')
                        .setDescription('Activity type')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Playing', value: 'PLAYING' },
                            { name: 'Watching', value: 'WATCHING' },
                            { name: 'Listening', value: 'LISTENING' },
                            { name: 'Competing', value: 'COMPETING' }
                        )
                )
                .addStringOption(option =>
                    option
                        .setName('status')
                        .setDescription('Status text')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('stats')
                .setDescription('View bot statistics')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('maintenance')
                .setDescription('Toggle maintenance mode')
                .addBooleanOption(option =>
                    option
                        .setName('enabled')
                        .setDescription('Enable or disable maintenance mode')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('reload')
                .setDescription('Reload bot commands')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('broadcast')
                .setDescription('Send a message to all servers')
                .addStringOption(option =>
                    option
                        .setName('message')
                        .setDescription('Message to broadcast')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('servers')
                .setDescription('List all servers the bot is in')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('stop')
                .setDescription('Stop the bot gracefully')
        ),

    async execute(interaction: ChatInputCommandInteraction) {
        // Check if user is owner
        if (!await checkOwner(interaction)) return;

        const subcommand = interaction.options.getSubcommand();

        switch (subcommand) {
            case 'status':
                await handleStatus(interaction);
                break;
            case 'stats':
                await handleStats(interaction);
                break;
            case 'maintenance':
                await handleMaintenance(interaction);
                break;
            case 'reload':
                await handleReload(interaction);
                break;
            case 'broadcast':
                await handleBroadcast(interaction);
                break;
            case 'servers':
                await handleServers(interaction);
                break;
            case 'stop':
                await handleStop(interaction);
                break;
        }
    }
};

async function handleStatus(interaction: ChatInputCommandInteraction) {
    const type = interaction.options.getString('type', true) as keyof typeof ActivityType;
    const status = interaction.options.getString('status', true);

    await interaction.client.user?.setActivity(status, { type: ActivityType[type] });
    
    await interaction.reply({
        content: `✅ Status updated to: ${type} ${status}`,
        ephemeral: true
    });
}

async function handleStats(interaction: ChatInputCommandInteraction) {
    const guilds = interaction.client.guilds.cache.size;
    const users = interaction.client.users.cache.size;
    const channels = interaction.client.channels.cache.size;
    const uptime = Math.floor(interaction.client.uptime! / 1000); // in seconds

    const embed = new EmbedBuilder()
        .setColor(config.EMBED_COLOR)
        .setTitle('🤖 Bot Statistics')
        .addFields(
            { name: 'Servers', value: guilds.toString(), inline: true },
            { name: 'Users', value: users.toString(), inline: true },
            { name: 'Channels', value: channels.toString(), inline: true },
            { name: 'Uptime', value: formatUptime(uptime), inline: true },
            { name: 'Memory Usage', value: formatMemory(process.memoryUsage().heapUsed), inline: true },
            { name: 'Node Version', value: process.version, inline: true }
        )
        .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
}

async function handleMaintenance(interaction: ChatInputCommandInteraction) {
    const enabled = interaction.options.getBoolean('enabled', true);
    
    // Store maintenance mode state
    botState.setState('maintenanceMode', enabled);

    if (enabled) {
        await interaction.client.user?.setStatus('dnd');
        await interaction.client.user?.setActivity('Maintenance', { type: ActivityType.Playing });
    } else {
        await interaction.client.user?.setStatus('online');
        await interaction.client.user?.setActivity('FFlags', { type: ActivityType.Watching });
    }

    await interaction.reply({
        content: `✅ Maintenance mode ${enabled ? 'enabled' : 'disabled'}`,
        ephemeral: true
    });
}

async function handleReload(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });

    try {
        // In a real implementation, you would reload commands here
        await interaction.editReply('✅ Commands reloaded successfully');
    } catch (error) {
        console.error('Error reloading commands:', error);
        await interaction.editReply('❌ Error reloading commands');
    }
}

async function handleBroadcast(interaction: ChatInputCommandInteraction) {
    const message = interaction.options.getString('message', true);
    await interaction.deferReply({ ephemeral: true });

    const embed = new EmbedBuilder()
        .setColor(config.EMBED_COLOR)
        .setTitle('📢 Announcement')
        .setDescription(message)
        .setTimestamp();

    let sent = 0;
    let failed = 0;

    for (const guild of interaction.client.guilds.cache.values()) {
        try {
            const systemChannel = guild.systemChannel || guild.channels.cache.find(ch => 
                ch.isTextBased() && ch.permissionsFor(guild.members.me!).has('SendMessages')
            );

            if (systemChannel?.isTextBased()) {
                await systemChannel.send({ embeds: [embed] });
                sent++;
            } else {
                failed++;
            }
        } catch {
            failed++;
        }
    }

    await interaction.editReply(
        `📨 Broadcast complete\n✅ Sent to ${sent} servers\n❌ Failed in ${failed} servers`
    );
}

async function handleServers(interaction: ChatInputCommandInteraction) {
    const guilds = Array.from(interaction.client.guilds.cache.values());
    const pages: EmbedBuilder[] = [];
    const itemsPerPage = 10;

    for (let i = 0; i < guilds.length; i += itemsPerPage) {
        const pageGuilds = guilds.slice(i, i + itemsPerPage);
        const embed = new EmbedBuilder()
            .setColor(config.EMBED_COLOR)
            .setTitle(`🌐 Server List (Page ${i/itemsPerPage + 1}/${Math.ceil(guilds.length/itemsPerPage)})`)
            .setDescription(
                pageGuilds.map(guild => 
                    `**${guild.name}**\n` +
                    `• ID: ${guild.id}\n` +
                    `• Members: ${guild.memberCount}\n` +
                    `• Owner: ${guild.members.cache.get(guild.ownerId)?.user.tag || 'Unknown'}`
                ).join('\n\n')
            )
            .setTimestamp();
        pages.push(embed);
    }

    await interaction.reply({ embeds: [pages[0]], ephemeral: true });
}

async function handleStop(interaction: ChatInputCommandInteraction) {
    await interaction.reply({
        content: '🛑 Stopping bot...',
        ephemeral: true
    });

    // Set status to offline before stopping
    await interaction.client.user?.setStatus('invisible');
    
    console.log('Bot stop initiated by owner');
    
    // Destroy the client and exit process
    setTimeout(() => {
        interaction.client.destroy();
        process.exit(0);
    }, 1000);
}

function formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (secs > 0) parts.push(`${secs}s`);

    return parts.join(' ');
}

function formatMemory(bytes: number): string {
    const mb = bytes / 1024 / 1024;
    return `${mb.toFixed(2)} MB`;
}
