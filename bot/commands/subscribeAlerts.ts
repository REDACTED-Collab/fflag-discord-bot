import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, ChannelType, TextChannel } from 'discord.js';
import { config } from '../config';

interface AlertSubscription {
    userId: string;
    guildId: string;
    channelId: string;
    pattern: string;
    type: 'all' | 'value_change' | 'new_flags';
    conditions?: {
        fromValue?: string;
        toValue?: string;
        platform?: string;
    };
    frequency: 'instant' | 'hourly' | 'daily';
}

export const subscribeAlerts = {
    data: new SlashCommandBuilder()
        .setName('subscribealerts')
        .setDescription('Subscribe to FFlag change notifications')
        .addStringOption(option =>
            option
                .setName('pattern')
                .setDescription('Pattern to watch (e.g., "Graphics", "Network", specific flag name)')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('type')
                .setDescription('Type of alerts to receive')
                .setRequired(true)
                .addChoices(
                    { name: 'All Changes', value: 'all' },
                    { name: 'Value Changes Only', value: 'value_change' },
                    { name: 'New Flags Only', value: 'new_flags' }
                )
        )
        .addChannelOption(option =>
            option
                .setName('channel')
                .setDescription('Channel to send notifications (default: current channel)')
                .setRequired(false)
        )
        .addStringOption(option =>
            option
                .setName('frequency')
                .setDescription('How often to receive notifications')
                .setRequired(false)
                .addChoices(
                    { name: 'Instant', value: 'instant' },
                    { name: 'Hourly Summary', value: 'hourly' },
                    { name: 'Daily Summary', value: 'daily' }
                )
        )
        .addStringOption(option =>
            option
                .setName('platform')
                .setDescription('Filter by platform')
                .setRequired(false)
                .addChoices(
                    { name: 'All Platforms', value: 'all' },
                    { name: 'PC', value: 'PCClient' },
                    { name: 'Mobile', value: 'MobileClient' },
                    { name: 'Console', value: 'ConsoleClient' }
                )
        )
        .addStringOption(option =>
            option
                .setName('condition_from')
                .setDescription('Alert when value changes from this value')
                .setRequired(false)
        )
        .addStringOption(option =>
            option
                .setName('condition_to')
                .setDescription('Alert when value changes to this value')
                .setRequired(false)
        ),

    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();

        try {
            const pattern = interaction.options.getString('pattern', true);
            const type = interaction.options.getString('type', true) as AlertSubscription['type'];
            const channel = (interaction.options.getChannel('channel') || interaction.channel) as TextChannel;
            const frequency = (interaction.options.getString('frequency') || 'instant') as AlertSubscription['frequency'];
            const platform = interaction.options.getString('platform') || 'all';
            const fromValue = interaction.options.getString('condition_from') || undefined;
            const toValue = interaction.options.getString('condition_to') || undefined;

            // Validate channel
            if (!channel || channel.type !== ChannelType.GuildText) {
                await interaction.editReply({
                    content: '❌ Please specify a valid text channel for notifications.'
                });
                return;
            }

            // Check channel permissions
            if (!channel.permissionsFor(interaction.client.user!)?.has(['SendMessages', 'ViewChannel'])) {
                await interaction.editReply({
                    content: '❌ I don\'t have permission to send messages in that channel.'
                });
                return;
            }

            // Create subscription
            const subscription: AlertSubscription = {
                userId: interaction.user.id,
                guildId: interaction.guildId!,
                channelId: channel.id,
                pattern,
                type,
                frequency,
                conditions: {
                    fromValue,
                    toValue,
                    platform: platform === 'all' ? undefined : platform
                }
            };

            // In a real implementation, you would store this in a database
            // For now, we'll just show what would be stored

            // Create confirmation embed
            const embed = new EmbedBuilder()
                .setColor(config.EMBED_COLOR)
                .setTitle('🔔 Alert Subscription Created')
                .setDescription(`You'll receive notifications for flag changes matching your criteria.`)
                .addFields(
                    {
                        name: 'Pattern',
                        value: pattern,
                        inline: true
                    },
                    {
                        name: 'Type',
                        value: type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
                        inline: true
                    },
                    {
                        name: 'Frequency',
                        value: frequency.charAt(0).toUpperCase() + frequency.slice(1),
                        inline: true
                    },
                    {
                        name: 'Channel',
                        value: `<#${channel.id}>`,
                        inline: true
                    }
                )
                .setTimestamp();

            // Add conditions if specified
            const conditions: string[] = [];
            if (fromValue) conditions.push(`From: \`${fromValue}\``);
            if (toValue) conditions.push(`To: \`${toValue}\``);
            if (platform !== 'all') conditions.push(`Platform: ${platform}`);

            if (conditions.length > 0) {
                embed.addFields({
                    name: 'Conditions',
                    value: conditions.join('\n'),
                    inline: false
                });
            }

            // Add example notification
            embed.addFields({
                name: 'Example Notification',
                value: generateExampleNotification(subscription),
                inline: false
            });

            await interaction.editReply({
                embeds: [embed],
                content: '✅ Alert subscription created successfully!'
            });

        } catch (error) {
            console.error('Error in subscribeAlerts command:', error);
            await interaction.editReply({
                content: '❌ An error occurred while setting up the alert subscription. Please try again later.'
            });
        }
    }
};

function generateExampleNotification(subscription: AlertSubscription): string {
    const examples = {
        all: `🔄 Flag Update: \`DFFlag${subscription.pattern}Example\`\nValue changed from \`false\` to \`true\``,
        value_change: `⚠️ Value Change: \`FFlag${subscription.pattern}Setting\` is now \`enabled\``,
        new_flags: `🆕 New Flag Detected: \`FFlag${subscription.pattern}Feature\`\nInitial value: \`true\``
    };

    return examples[subscription.type] +
           `\n\n*This is an example of how notifications will appear.*`;
}
