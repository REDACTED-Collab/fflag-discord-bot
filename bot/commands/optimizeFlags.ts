import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { githubService } from '../services/githubService';
import { config } from '../config';

const OPTIMIZATION_CATEGORIES = {
    fps: {
        keywords: ['fps', 'frame', 'render', 'graphics', 'performance', 'quality'],
        recommendations: {
            'FFlagGlobalWindRendering': false,
            'FFlagRenderCheckThreading': true,
            'DFIntTaskSchedulerTargetFps': 9999,
            'FFlagGraphicsGLEnableSuperHQShadersExclusion': false,
            'FFlagGraphicsGLEnableHQShadersExclusion': false,
            'FFlagGameBasicSettingsFramerateCap': true
        }
    },
    latency: {
        keywords: ['latency', 'ping', 'network', 'connection', 'packet', 'sync'],
        recommendations: {
            'DFIntConnectionExtraTicksBehind': 0,
            'DFIntConnectionTicksBehind': 0,
            'DFIntMaxNetworkPackets': 999,
            'DFIntNetworkMessageRateLimit': 0,
            'FFlagNetworkOptimization': true,
        }
    },
    memory: {
        keywords: ['memory', 'ram', 'cache', 'heap', 'garbage'],
        recommendations: {
            'FFlagMemoryPrioritization': true,
            'DFIntMemoryOptimization': 1,
            'FFlagGarbageCollectionEnabled': true,
            'DFIntCacheSize': 256,
        }
    }
};

export const optimizeFlags = {
    data: new SlashCommandBuilder()
        .setName('optimizeflags')
        .setDescription('Get recommended FFlag settings for performance optimization')
        .addStringOption(option =>
            option
                .setName('category')
                .setDescription('What type of optimization do you want?')
                .setRequired(true)
                .addChoices(
                    { name: 'FPS Boost', value: 'fps' },
                    { name: 'Lower Latency', value: 'latency' },
                    { name: 'Memory Optimization', value: 'memory' },
                    { name: 'All Performance', value: 'all' }
                )
        )
        .addBooleanOption(option =>
            option
                .setName('detailed')
                .setDescription('Include detailed explanations')
                .setRequired(false)
        ),

    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();

        try {
            const category = interaction.options.getString('category', true);
            const detailed = interaction.options.getBoolean('detailed') ?? false;
            
            // Get relevant flags based on category
            const relevantFlags = new Set<string>();
            const flagValues: Record<string, any> = {};
            
            if (category === 'all') {
                Object.values(OPTIMIZATION_CATEGORIES).forEach(cat => {
                    Object.entries(cat.recommendations).forEach(([flag, value]) => {
                        relevantFlags.add(flag);
                        flagValues[flag] = value;
                    });
                });
            } else {
                const categoryData = OPTIMIZATION_CATEGORIES[category as keyof typeof OPTIMIZATION_CATEGORIES];
                Object.entries(categoryData.recommendations).forEach(([flag, value]) => {
                    relevantFlags.add(flag);
                    flagValues[flag] = value;
                });
            }

            // Search for additional related flags
            const additionalFlags = await Promise.all(
                Array.from(relevantFlags).map(async flag => {
                    const data = await githubService.getFlagData(flag);
                    return data;
                })
            );

            // Create the optimization embed
            const embed = new EmbedBuilder()
                .setColor(config.EMBED_COLOR)
                .setTitle(`⚡ Performance Optimization: ${category.toUpperCase()}`)
                .setDescription('Here are the recommended FFlag settings for optimal performance:')
                .setTimestamp();

            // Add recommended settings
            let settingsContent = '';
            Object.entries(flagValues).forEach(([flag, value]) => {
                settingsContent += `\`${flag}\`: ${value}\n`;
            });

            embed.addFields({
                name: 'Recommended Settings',
                value: settingsContent || 'No specific recommendations available.',
                inline: false
            });

            if (detailed) {
                // Add explanations for each flag
                const explanations = Object.keys(flagValues).map(flag => {
                    let explanation = '• ';
                    if (flag.includes('FPS')) {
                        explanation += 'Controls frame rate limiting and synchronization';
                    } else if (flag.includes('Graphics')) {
                        explanation += 'Affects visual quality and rendering performance';
                    } else if (flag.includes('Network')) {
                        explanation += 'Impacts network communication and latency';
                    } else if (flag.includes('Memory')) {
                        explanation += 'Controls memory usage and optimization';
                    }
                    return `\`${flag}\`: ${explanation}`;
                });

                embed.addFields({
                    name: 'Explanations',
                    value: explanations.join('\n'),
                    inline: false
                });
            }

            // Add usage instructions
            embed.addFields({
                name: 'How to Use',
                value: 'To apply these settings:\n' +
                       '1. Copy the flag names and values\n' +
                       '2. Use `/convertjson` to convert to your preferred format\n' +
                       '3. Apply in your Roblox settings\n\n' +
                       '⚠️ Note: Some settings may require game restart to take effect.',
                inline: false
            });

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error in optimizeFlags command:', error);
            await interaction.editReply({
                content: '❌ An error occurred while fetching optimization recommendations. Please try again later.'
            });
        }
    }
};
