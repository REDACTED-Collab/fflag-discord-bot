import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { githubService } from '../services/githubService';
import { config } from '../config';

export const trackFlag = {
    data: new SlashCommandBuilder()
        .setName('trackflag')
        .setDescription('Track changes to a specific flag')
        .addStringOption(option =>
            option
                .setName('flag')
                .setDescription('The name of the flag to track')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('channel')
                .setDescription('Channel to send notifications (default: current channel)')
                .setRequired(false)
        ),

    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();

        try {
            const flagName = interaction.options.getString('flag', true);
            const channelOption = interaction.options.getString('channel');
            
            const flagData = await githubService.getFlagData(flagName);
            if (!flagData) {
                await interaction.editReply({
                    content: `❌ Could not find flag: \`${flagName}\``
                });
                return;
            }

            // In a real implementation, you would store this in a database
            const embed = new EmbedBuilder()
                .setColor(config.EMBED_COLOR)
                .setTitle('🔔 Flag Tracking Started')
                .setDescription(`Now tracking changes to \`${flagName}\``)
                .addFields(
                    {
                        name: 'Current Value',
                        value: String(flagData.Value),
                        inline: true
                    },
                    {
                        name: 'Type',
                        value: flagData.Type,
                        inline: true
                    },
                    {
                        name: 'Platform',
                        value: flagData.Platform || 'All Platforms',
                        inline: true
                    },
                    {
                        name: 'Notifications',
                        value: channelOption ? `Will be sent to ${channelOption}` : 'Will be sent here',
                        inline: false
                    }
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('Error in trackFlag command:', error);
            await interaction.editReply({
                content: '❌ An error occurred while setting up flag tracking. Please try again later.'
            });
        }
    }
};
