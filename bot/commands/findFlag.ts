import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { githubService } from '../services/githubService';
import { config } from '../config';
import { FlagData } from '../types';

export const findFlag = {
    data: new SlashCommandBuilder()
        .setName('findflag')
        .setDescription('Search for FFlags by keyword')
        .addStringOption(option =>
            option
                .setName('keyword')
                .setDescription('Keyword to search for')
                .setRequired(true)
                .setMinLength(2)
        )
        .addBooleanOption(option =>
            option
                .setName('include_studio')
                .setDescription('Include Studio FFlags in search results (default: true)')
        ),

    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();

        try {
            const keyword = interaction.options.getString('keyword', true);
            const includeStudio = interaction.options.getBoolean('include_studio') ?? true;

            const flags = await githubService.searchFlags(keyword, includeStudio);

            if (flags.length === 0) {
                await interaction.editReply({
                    content: `❌ No flags found matching keyword: \`${keyword}\``
                });
                return;
            }

            // Group flags by type (FFlag, DFFlag, etc.)
            const groupedFlags = flags.reduce((acc, flag: FlagData) => {
                const type = flag.name.startsWith('DFFlag') ? 'DFFlag' :
                           flag.name.startsWith('FFlag') ? 'FFlag' :
                           flag.name.startsWith('FInt') ? 'FInt' :
                           'Other';
                if (!acc[type]) {
                    acc[type] = [];
                }
                acc[type].push(flag);
                return acc;
            }, {} as Record<string, FlagData[]>);

            const embeds = [];
            let currentEmbed = new EmbedBuilder()
                .setColor(config.EMBED_COLOR)
                .setTitle(`🔍 Search Results: "${keyword}"`)
                .setTimestamp();

            // Process each flag type
            for (const [type, typeFlags] of Object.entries(groupedFlags)) {
                let fieldContent = '';
                
                for (const flag of typeFlags) {
                    const value = String(flag.Value);
                    const truncatedValue = value.length > 50 ? value.substring(0, 47) + '...' : value;
                    const line = `• \`${flag.name}\`: ${truncatedValue}\n`;
                    
                    // Discord has a 1024 character limit per field
                    if (fieldContent.length + line.length > 1000) {
                        currentEmbed.addFields({
                            name: `${type} (Continued)`,
                            value: fieldContent || 'No flags',
                            inline: false
                        });
                        fieldContent = line;
                        
                        // Create new embed if we're at the field limit
                        if (currentEmbed.data.fields?.length === 25) {
                            embeds.push(currentEmbed);
                            currentEmbed = new EmbedBuilder()
                                .setColor(config.EMBED_COLOR)
                                .setTitle(`🔍 Search Results: "${keyword}" (Continued)`)
                                .setTimestamp();
                        }
                    } else {
                        fieldContent += line;
                    }
                }

                if (fieldContent) {
                    currentEmbed.addFields({
                        name: `${type} (${typeFlags.length} matches)`,
                        value: fieldContent,
                        inline: false
                    });
                }
            }

            embeds.push(currentEmbed);

            // Add summary to first embed
            embeds[0].setDescription(
                `Found ${flags.length} flags across ${Object.keys(groupedFlags).length} types.\n` +
                `${includeStudio ? '' : '*Studio flags excluded from search.*'}\n\n` +
                `Use \`/checkflag <name>\` to get detailed information about a specific flag.`
            );

            // Send embeds
            await interaction.editReply({ embeds: [embeds[0]] });
            
            // Send additional embeds as follow-ups if they exist
            for (let i = 1; i < embeds.length; i++) {
                await interaction.followUp({ embeds: [embeds[i]] });
            }

        } catch (error) {
            console.error('Error in findFlag command:', error);
            await interaction.editReply({
                content: '❌ An error occurred while searching for flags. Please try again later.'
            });
        }
    }
};
