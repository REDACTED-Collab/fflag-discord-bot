import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { githubService } from '../services/githubService';
import { config } from '../config';
import { FlagData } from '../types';

export const analyzeFlags = {
    data: new SlashCommandBuilder()
        .setName('analyzeflags')
        .setDescription('Analyze patterns and trends in FFlags')
        .addStringOption(option =>
            option
                .setName('pattern')
                .setDescription('Pattern to analyze (e.g., "Graphics", "Performance", "Chat")')
                .setRequired(true)
        )
        .addBooleanOption(option =>
            option
                .setName('detailed')
                .setDescription('Show detailed analysis')
                .setRequired(false)
        ),

    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();

        try {
            const pattern = interaction.options.getString('pattern', true);
            const detailed = interaction.options.getBoolean('detailed') ?? false;
            
            // Search for flags matching the pattern
            const flags = await githubService.searchFlags(pattern, true);
            
            if (flags.length === 0) {
                await interaction.editReply({
                    content: `❌ No flags found matching pattern: \`${pattern}\``
                });
                return;
            }

            // Analyze the flags
            const analysis = performFlagAnalysis(flags);
            
            // Create main embed
            const mainEmbed = new EmbedBuilder()
                .setColor(config.EMBED_COLOR)
                .setTitle(`📊 Flag Analysis: "${pattern}"`)
                .setDescription(`Found ${flags.length} related flags`)
                .addFields(
                    {
                        name: 'Type Distribution',
                        value: formatDistribution(analysis.typeDistribution),
                        inline: true
                    },
                    {
                        name: 'Platform Distribution',
                        value: formatDistribution(analysis.platformDistribution),
                        inline: true
                    },
                    {
                        name: 'Value Statistics',
                        value: [
                            `True: ${analysis.valueStats.true}`,
                            `False: ${analysis.valueStats.false}`,
                            `Numeric: ${analysis.valueStats.numeric}`,
                            `Other: ${analysis.valueStats.other}`
                        ].join('\n'),
                        inline: true
                    }
                )
                .setTimestamp();

            if (detailed) {
                // Add common patterns section
                if (analysis.commonPatterns.length > 0) {
                    mainEmbed.addFields({
                        name: 'Common Patterns',
                        value: analysis.commonPatterns.map(p => `• ${p}`).join('\n'),
                        inline: false
                    });
                }

                // Add recommendations
                mainEmbed.addFields({
                    name: 'Recommendations',
                    value: generateRecommendations(analysis, pattern),
                    inline: false
                });

                // Add example flags
                const examples = flags.slice(0, 5).map(flag => 
                    `\`${flag.name}\`: ${String(flag.Value).substring(0, 30)}`
                ).join('\n');

                mainEmbed.addFields({
                    name: 'Example Flags',
                    value: examples,
                    inline: false
                });
            }

            await interaction.editReply({ embeds: [mainEmbed] });

        } catch (error) {
            console.error('Error in analyzeFlags command:', error);
            await interaction.editReply({
                content: '❌ An error occurred while analyzing flags. Please try again later.'
            });
        }
    }
};

interface Analysis {
    typeDistribution: Record<string, number>;
    platformDistribution: Record<string, number>;
    valueStats: {
        true: number;
        false: number;
        numeric: number;
        other: number;
    };
    commonPatterns: string[];
}

function performFlagAnalysis(flags: FlagData[]): Analysis {
    const analysis: Analysis = {
        typeDistribution: {},
        platformDistribution: {},
        valueStats: { true: 0, false: 0, numeric: 0, other: 0 },
        commonPatterns: []
    };

    flags.forEach(flag => {
        // Type distribution
        analysis.typeDistribution[flag.Type] = (analysis.typeDistribution[flag.Type] || 0) + 1;

        // Platform distribution
        if (flag.Platform) {
            analysis.platformDistribution[flag.Platform] = (analysis.platformDistribution[flag.Platform] || 0) + 1;
        }

        // Value statistics
        if (flag.Value === true) analysis.valueStats.true++;
        else if (flag.Value === false) analysis.valueStats.false++;
        else if (typeof flag.Value === 'number') analysis.valueStats.numeric++;
        else analysis.valueStats.other++;
    });

    // Analyze common patterns in flag names
    const words = flags.map(f => f.name.replace(/[A-Z][a-z]+/g, word => word.toLowerCase()))
        .join(' ')
        .split(/[A-Z]+/);
    
    const wordFreq: Record<string, number> = {};
    words.forEach(word => {
        if (word.length > 3) { // Ignore short words
            wordFreq[word] = (wordFreq[word] || 0) + 1;
        }
    });

    analysis.commonPatterns = Object.entries(wordFreq)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([word, count]) => `${word} (${count} occurrences)`);

    return analysis;
}

function formatDistribution(dist: Record<string, number>): string {
    const total = Object.values(dist).reduce((a, b) => a + b, 0);
    return Object.entries(dist)
        .sort(([,a], [,b]) => b - a)
        .map(([key, value]) => `${key}: ${Math.round(value / total * 100)}%`)
        .join('\n');
}

function generateRecommendations(analysis: Analysis, pattern: string): string {
    const recommendations: string[] = [];

    // Add recommendations based on the analysis
    if (analysis.valueStats.true + analysis.valueStats.false > 0) {
        const enabledRatio = analysis.valueStats.true / (analysis.valueStats.true + analysis.valueStats.false);
        if (enabledRatio > 0.8) {
            recommendations.push(`Most ${pattern}-related features are enabled (${Math.round(enabledRatio * 100)}%)`);
        } else if (enabledRatio < 0.2) {
            recommendations.push(`Most ${pattern}-related features are disabled (${Math.round((1 - enabledRatio) * 100)}%)`);
        }
    }

    if (analysis.valueStats.numeric > 0) {
        recommendations.push(`Contains ${analysis.valueStats.numeric} configurable numeric values`);
    }

    if (Object.keys(analysis.platformDistribution).length > 1) {
        recommendations.push('Features vary across different platforms');
    }

    return recommendations.length > 0 
        ? recommendations.map(r => `• ${r}`).join('\n')
        : 'No specific recommendations available.';
}
