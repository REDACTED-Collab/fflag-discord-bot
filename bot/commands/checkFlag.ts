import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { githubService } from '../services/githubService';
import { config } from '../config';

export const checkFlag = {
    data: new SlashCommandBuilder()
        .setName('checkflag')
        .setDescription('Check details of a specific FFlag')
        .addStringOption(option =>
            option
                .setName('flag')
                .setDescription('The name of the FFlag to check')
                .setRequired(true)
        ),

    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();

        try {
            const flagName = interaction.options.getString('flag', true);
            const flagData = await githubService.getFlagData(flagName);

            if (!flagData) {
                await interaction.editReply({
                    content: `❌ Could not find FFlag: \`${flagName}\`\nMake sure you've entered the correct flag name.`
                });
                return;
            }

            const embed = new EmbedBuilder()
                .setColor(config.EMBED_COLOR)
                .setTitle(`🔍 FFlag Details`)
                .setDescription(`\`${flagData.name}\``)
                .addFields(
                    { 
                        name: 'Type', 
                        value: flagData.Type, 
                        inline: true 
                    },
                    { 
                        name: 'Value', 
                        value: String(flagData.Value), 
                        inline: true 
                    }
                )
                .setTimestamp();

            if (flagData.Platform) {
                embed.addFields({ 
                    name: 'Platform', 
                    value: flagData.Platform, 
                    inline: true 
                });
            }

            if (flagData.Description) {
                embed.addFields({ 
                    name: 'Description', 
                    value: flagData.Description, 
                    inline: false 
                });
            }

            // Add flag category
            const category = flagData.name.startsWith('DFFlag') ? 'Dynamic Fast Flag' :
                           flagData.name.startsWith('FFlag') ? 'Fast Flag' :
                           flagData.name.startsWith('FInt') ? 'Fast Integer' :
                           'Other';

            embed.addFields({ 
                name: 'Category', 
                value: category, 
                inline: true 
            });

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('Error in checkFlag command:', error);
            await interaction.editReply({
                content: '❌ An error occurred while fetching the flag data. Please try again later.'
            });
        }
    }
};
