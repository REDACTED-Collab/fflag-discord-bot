import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { githubService } from '../services/githubService';
import { config } from '../config';
import { FlagData } from '../types';

interface FlagStats {
    totalFlags: number;
    typeDistribution: Record<string, number>;
    platformDistribution: Record<string, number>;
    valueTypes: {
        boolean: number;
        number: number;
        string: number;
    };
    patterns: {
        name: string;
        count: number;
    }[];
}

export const flagStats = {
    data: new SlashCommandBuilder()
        .setName('flagstats')
        .setDescription('Get detailed statistics about FFlags')
        .addStringOption(option =>
            option
                .setName('timeframe')
                .setDescription('Time period to analyze')
                .setRequired(false)
                .addChoices(
                    { name: 'Last 24 Hours', value: '24' },
                    { name: 'Last 48 Hours', value: '48' },
                    { name: 'Last 72 Hours', value: '72' }
                )
        )
        .addBooleanOption(option =>
            option
                .setName('include_patterns')
                .setDescription('Include common naming patterns analysis')
                .setRequired(false)
        ),

    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();

        try {
            const hours = parseInt(interaction.options.getString('timeframe') || '24');
            const includePatterns = interaction.options.getBoolean('include_patterns') ?? false;

            // Fetch flags
            const flags = await githubService.getNewFlags(hours);

            if (flags.length === 0) {
                await interaction.editReply({
                    content: `❌ No flags found in the last ${hours} hours.`
                });
                return;
            }

            // Analyze flags
            const stats = analyzeFlags(flags);

            // Create main embed
            const mainEmbed = new EmbedBuilder()
                .setColor(config.EMBED_COLOR)
                .setTitle('📊 FFlags Statistics')
                .setDescription(
                    `Analysis of ${stats.totalFlags} flags from the last ${hours} hours.\n` +
                    `Last updated: ${new Date().toLocaleString()}`
                )
                .addFields(
                    {
                        name: 'Flag Types',
                        value: formatDistribution(stats.typeDistribution),
                        inline: true
                    },
                    {
                        name: 'Platforms',
                        value: formatDistribution(stats.platformDistribution),
                        inline: true
                    },
                    {
                        name: 'Value Types',
                        value: [
                            `Boolean: ${stats.valueTypes.boolean}`,
                            `Number: ${stats.valueTypes.number}`,
                            `String: ${stats.valueTypes.string}`
                        ].join('\n'),
                        inline: true
                    }
                )
                .setTimestamp();

            // Add patterns analysis if requested
            if (includePatterns && stats.patterns.length > 0) {
                mainEmbed.addFields({
                    name: 'Common Patterns',
                    value: stats.patterns
                        .slice(0, 5)
                        .map(p => `• ${p.name}: ${p.count} flags`)
                        .join('\n'),
                    inline: false
                });

                // Add insights based on patterns
                const insights = generateInsights(stats);
                if (insights.length > 0) {
                    mainEmbed.addFields({
                        name: '🔍 Insights',
                        value: insights.join('\n'),
                        inline: false
                    });
                }
            }

            // Add trend indicators
            const trends = analyzeTrends(flags);
            if (trends.length > 0) {
                mainEmbed.addFields({
                    name: '📈 Trends',
                    value: trends.join('\n'),
                    inline: false
                });
            }

            await interaction.editReply({ embeds: [mainEmbed] });

        } catch (error) {
            console.error('Error in flagStats command:', error);
            await interaction.editReply({
                content: '❌ An error occurred while generating statistics. Please try again later.'
            });
        }
    }
};

function analyzeFlags(flags: FlagData[]): FlagStats {
    const stats: FlagStats = {
        totalFlags: flags.length,
        typeDistribution: {},
        platformDistribution: {},
        valueTypes: {
            boolean: 0,
            number: 0,
            string: 0
        },
        patterns: []
    };

    // Analyze each flag
    flags.forEach(flag => {
        // Type distribution (FFlag, DFFlag, etc.)
        const flagType = flag.name.match(/^[A-Z]+[A-Z][a-z]+/)?.[0] || 'Other';
        stats.typeDistribution[flagType] = (stats.typeDistribution[flagType] || 0) + 1;

        // Platform distribution
        if (flag.Platform) {
            stats.platformDistribution[flag.Platform] = (stats.platformDistribution[flag.Platform] || 0) + 1;
        }

        // Value types
        if (typeof flag.Value === 'boolean') stats.valueTypes.boolean++;
        else if (typeof flag.Value === 'number') stats.valueTypes.number++;
        else stats.valueTypes.string++;
    });

    // Analyze naming patterns
    const patterns = new Map<string, number>();
    flags.forEach(flag => {
        const words = flag.name.match(/[A-Z][a-z]+/g) || [];
        words.forEach(word => {
            patterns.set(word, (patterns.get(word) || 0) + 1);
        });
    });

    stats.patterns = Array.from(patterns.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

    return stats;
}

function formatDistribution(dist: Record<string, number>): string {
    const total = Object.values(dist).reduce((a, b) => a + b, 0);
    return Object.entries(dist)
        .sort(([,a], [,b]) => b - a)
        .map(([key, value]) => `${key}: ${Math.round(value / total * 100)}%`)
        .join('\n') || 'No data available';
}

function generateInsights(stats: FlagStats): string[] {
    const insights: string[] = [];

    // Add insights based on patterns
    const commonPatterns = stats.patterns.slice(0, 3).map(p => p.name);
    if (commonPatterns.includes('Graphics')) {
        insights.push('🎮 High focus on graphics-related features');
    }
    if (commonPatterns.includes('Network')) {
        insights.push('🌐 Significant networking improvements');
    }
    if (commonPatterns.includes('Performance')) {
        insights.push('⚡ Performance optimization is a key focus');
    }

    return insights;
}

function analyzeTrends(flags: FlagData[]): string[] {
    const trends: string[] = [];
    
    // Analyze boolean flags
    const booleanFlags = flags.filter(f => typeof f.Value === 'boolean');
    const enabledCount = booleanFlags.filter(f => f.Value === true).length;
    const disabledCount = booleanFlags.filter(f => f.Value === false).length;
    
    if (booleanFlags.length > 0) {
        const enabledPercentage = (enabledCount / booleanFlags.length) * 100;
        if (enabledPercentage > 75) {
            trends.push('📈 Most new features are being enabled');
        } else if (enabledPercentage < 25) {
            trends.push('📉 Most new features are currently disabled');
        }
    }

    // Analyze platform distribution
    const platformCounts = flags.reduce((acc, flag) => {
        if (flag.Platform) {
            acc[flag.Platform] = (acc[flag.Platform] || 0) + 1;
        }
        return acc;
    }, {} as Record<string, number>);

    const maxPlatform = Object.entries(platformCounts)
        .sort(([,a], [,b]) => b - a)[0];
    
    if (maxPlatform) {
        trends.push(`🎯 Most changes targeting ${maxPlatform[0]}`);
    }

    return trends;
}
