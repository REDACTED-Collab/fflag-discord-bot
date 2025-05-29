import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { githubService } from '../services/githubService';
import { config } from '../config';

export const compareFlags = {
    data: new SlashCommandBuilder()
        .setName('compareflags')
        .setDescription('Compare flags between different platforms')
        .addStringOption(option =>
            option
                .setName('flag')
                .setDescription('The name of the flag to compare')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('platforms')
                .setDescription('Platforms to compare (comma-separated, e.g., PCClient,MobileClient)')
                .setRequired(false)
        ),

    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();

        try {
            const flagName = interaction.options.getString('flag', true);
            const platformsInput = interaction.options.getString('platforms');
            
            // Get all platforms if none specified
            const platforms = platformsInput 
                ? platformsInput.split(',').map(p => p.trim())
                : ['PCClient', 'MobileClient', 'XboxClient', 'ConsoleClient', 'StudioClient'];

            const comparisons = await Promise.all(
                platforms.map(async platform => {
                    const data = await githubService.getFlagDataForPlatform(flagName, platform);
                    return {
                        platform,
                        data
                    };
                })
            );

            const validComparisons = comparisons.filter(c => c.data !== null);

            if (validComparisons.length === 0) {
                await interaction.editReply({
                    content: `❌ Could not find flag \`${flagName}\` in any of the specified platforms.`
                });
                return;
            }

            // Create comparison embed
            const embed = new EmbedBuilder()
                .setColor(config.EMBED_COLOR)
                .setTitle(`🔄 Flag Comparison: ${flagName}`)
                .setDescription('Values across different platforms:')
                .addFields(
                    validComparisons.map(comparison => ({
                        name: comparison.platform,
                        value: `Value: \`${comparison.data?.Value}\`\nType: ${comparison.data?.Type}`,
                        inline: true
                    }))
                )
                .setTimestamp();

            // Add analysis field
            const allSame = validComparisons.every((c, i, arr) => 
                i === 0 || String(c.data?.Value) === String(arr[0].data?.Value)
            );

            embed.addFields({
                name: 'Analysis',
                value: allSame 
                    ? '✅ This flag has the same value across all platforms.'
                    : '⚠️ This flag has different values across platforms.',
                inline: false
            });

            // Add recommendations if values differ
            if (!allSame) {
                const recommendations = [];
                if (validComparisons.some(c => String(c.data?.Value).toLowerCase() === 'true')) {
                    recommendations.push('• Some platforms have this feature enabled while others don\'t');
                }
                if (validComparisons.some(c => typeof c.data?.Value === 'number')) {
                    const values = validComparisons
                        .filter(c => typeof c.data?.Value === 'number')
                        .map(c => Number(c.data?.Value));
                    if (Math.max(...values) !== Math.min(...values)) {
                        recommendations.push('• Performance/configuration values vary between platforms');
                    }
                }

                if (recommendations.length > 0) {
                    embed.addFields({
                        name: 'Recommendations',
                        value: recommendations.join('\n'),
                        inline: false
                    });
                }
            }

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error in compareFlags command:', error);
            await interaction.editReply({
                content: '❌ An error occurred while comparing flags. Please try again later.'
            });
        }
    }
};
