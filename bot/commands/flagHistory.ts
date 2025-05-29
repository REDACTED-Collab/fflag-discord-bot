import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { githubService } from '../services/githubService';
import { config } from '../config';

interface HistoryEntry {
    timestamp: number;
    value: any;
    platform?: string;
}

export const flagHistory = {
    data: new SlashCommandBuilder()
        .setName('flaghistory')
        .setDescription('View historical changes of a flag')
        .addStringOption(option =>
            option
                .setName('flag')
                .setDescription('Name of the flag to check')
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option
                .setName('days')
                .setDescription('Number of days to look back (default: 7)')
                .setRequired(false)
                .setMinValue(1)
                .setMaxValue(30)
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
        ),

    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();

        try {
            const flagName = interaction.options.getString('flag', true);
            const days = interaction.options.getInteger('days') || 7;
            const platform = interaction.options.getString('platform') || 'all';

            // Get current flag data
            const currentData = await githubService.getFlagData(flagName);
            if (!currentData) {
                await interaction.editReply({
                    content: `❌ Could not find flag: \`${flagName}\``
                });
                return;
            }

            // In a real implementation, you would fetch historical data from a database
            // For now, we'll create sample historical data
            const history = generateSampleHistory(currentData, days);

            // Create timeline embed
            const embed = new EmbedBuilder()
                .setColor(config.EMBED_COLOR)
                .setTitle(`📜 Flag History: ${flagName}`)
                .setDescription(
                    `Historical changes over the past ${days} days\n` +
                    `Current Value: \`${String(currentData.Value)}\``
                )
                .addFields(
                    {
                        name: 'Type',
                        value: currentData.Type,
                        inline: true
                    },
                    {
                        name: 'Platform',
                        value: currentData.Platform || 'All Platforms',
                        inline: true
                    }
                )
                .setTimestamp();

            // Add timeline
            const timeline = formatTimeline(history);
            if (timeline.length > 0) {
                embed.addFields({
                    name: 'Change Timeline',
                    value: timeline.join('\n'),
                    inline: false
                });
            }

            // Add change statistics
            const stats = analyzeChanges(history);
            embed.addFields({
                name: 'Change Statistics',
                value: [
                    `Total Changes: ${history.length - 1}`,
                    `Most Common Value: \`${stats.mostCommonValue}\``,
                    `Average Time Between Changes: ${stats.avgTimeBetweenChanges}`,
                    stats.trend ? `Trend: ${stats.trend}` : null
                ].filter(Boolean).join('\n'),
                inline: false
            });

            // Add recommendations based on history
            const recommendations = generateRecommendations(history, currentData);
            if (recommendations.length > 0) {
                embed.addFields({
                    name: '💡 Insights',
                    value: recommendations.join('\n'),
                    inline: false
                });
            }

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error in flagHistory command:', error);
            await interaction.editReply({
                content: '❌ An error occurred while fetching flag history. Please try again later.'
            });
        }
    }
};

function generateSampleHistory(currentData: any, days: number): HistoryEntry[] {
    const history: HistoryEntry[] = [];
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;

    // Add current state
    history.push({
        timestamp: now,
        value: currentData.Value,
        platform: currentData.Platform
    });

    // Generate some sample historical entries
    for (let i = 1; i <= days; i++) {
        if (Math.random() > 0.7) { // 30% chance of having a change on any given day
            history.push({
                timestamp: now - (i * dayMs),
                value: typeof currentData.Value === 'boolean' ? !currentData.Value : currentData.Value,
                platform: currentData.Platform
            });
        }
    }

    return history.sort((a, b) => b.timestamp - a.timestamp);
}

function formatTimeline(history: HistoryEntry[]): string[] {
    return history.map((entry, index) => {
        const date = new Date(entry.timestamp).toLocaleString();
        const value = String(entry.value);
        
        if (index === 0) {
            return `📍 Current: \`${value}\` (${date})`;
        }

        const prevValue = history[index - 1].value;
        const changeSymbol = value === prevValue ? '↔️' : (value > prevValue ? '📈' : '📉');
        return `${changeSymbol} Changed to \`${value}\` (${date})`;
    });
}

function analyzeChanges(history: HistoryEntry[]) {
    // Find most common value
    const valueCounts = history.reduce((acc, entry) => {
        const value = String(entry.value);
        acc[value] = (acc[value] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const mostCommonValue = Object.entries(valueCounts)
        .sort(([,a], [,b]) => b - a)[0][0];

    // Calculate average time between changes
    let totalTime = 0;
    let changes = 0;
    for (let i = 1; i < history.length; i++) {
        const timeDiff = history[i-1].timestamp - history[i].timestamp;
        totalTime += timeDiff;
        changes++;
    }

    const avgTime = changes > 0 ? Math.round(totalTime / changes / (1000 * 60 * 60)) : 0;

    // Determine trend
    let trend = '';
    const recentChanges = history.slice(0, 3);
    const allTrue = recentChanges.every(h => h.value === true);
    const allFalse = recentChanges.every(h => h.value === false);
    
    if (allTrue) trend = '🟢 Consistently enabled';
    else if (allFalse) trend = '🔴 Consistently disabled';
    else trend = '🔄 Frequently changing';

    return {
        mostCommonValue,
        avgTimeBetweenChanges: `~${avgTime} hours`,
        trend
    };
}

function generateRecommendations(history: HistoryEntry[], currentData: any): string[] {
    const recommendations: string[] = [];

    // Check stability
    const changes = history.length - 1;
    if (changes === 0) {
        recommendations.push('✨ This flag has been stable with no recent changes');
    } else if (changes > 5) {
        recommendations.push('⚠️ This flag changes frequently - monitor closely');
    }

    // Check value patterns
    const values = new Set(history.map(h => String(h.value)));
    if (values.size === 1) {
        recommendations.push('📊 Value has remained consistent - might be a stable setting');
    }

    // Platform-specific recommendations
    if (currentData.Platform) {
        recommendations.push(`🎮 This is a ${currentData.Platform}-specific flag`);
    }

    return recommendations;
}
