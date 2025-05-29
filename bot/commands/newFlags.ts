import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } from 'discord.js';
import { githubService } from '../services/githubService';
import { config } from '../config';
import { FlagData } from '../types';

const MAX_FLAGS_PER_PAGE = 15;
const MAX_VALUE_LENGTH = 50;
const PAGINATION_TIMEOUT = 300000; // 5 minutes

export const newFlags = {
    data: new SlashCommandBuilder()
        .setName('newfflags')
        .setDescription('List new flags discovered within the past 24 hours')
        .addIntegerOption(option =>
            option
                .setName('hours')
                .setDescription('Number of hours to look back (default: 24)')
                .setMinValue(1)
                .setMaxValue(72)
        )
        .addStringOption(option =>
            option
                .setName('type')
                .setDescription('Filter by flag type')
                .addChoices(
                    { name: 'All Types', value: 'all' },
                    { name: 'FFlags Only', value: 'fflag' },
                    { name: 'DFFlags Only', value: 'dfflag' },
                    { name: 'FInts Only', value: 'fint' }
                )
        ),

    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();

        try {
            const hours = interaction.options.getInteger('hours') || 24;
            const typeFilter = interaction.options.getString('type') || 'all';
            const flags = await githubService.getNewFlags(hours);

            if (flags.length === 0) {
                await interaction.editReply({
                    content: `❌ No new flags found in the past ${hours} hours.`
                });
                return;
            }

            // Group and filter flags by type
            const groupedFlags = flags.reduce((acc, flag: FlagData) => {
                const type = flag.name.startsWith('DFFlag') ? 'DFFlag' :
                           flag.name.startsWith('FFlag') ? 'FFlag' :
                           flag.name.startsWith('FInt') ? 'FInt' :
                           'Other';
                           
                if (typeFilter !== 'all') {
                    if ((typeFilter === 'fflag' && type !== 'FFlag') ||
                        (typeFilter === 'dfflag' && type !== 'DFFlag') ||
                        (typeFilter === 'fint' && type !== 'FInt')) {
                        return acc;
                    }
                }
                
                if (!acc[type]) {
                    acc[type] = [];
                }
                acc[type].push(flag);
                return acc;
            }, {} as Record<string, FlagData[]>);

            // Create summary embed
            const summaryEmbed = new EmbedBuilder()
                .setColor(config.EMBED_COLOR)
                .setTitle(`🆕 FFlags Overview (Past ${hours} hours)`)
                .addFields(
                    Object.entries(groupedFlags).map(([type, typeFlags]) => ({
                        name: `${type} Stats`,
                        value: `Total: ${typeFlags.length}\nTrue: ${typeFlags.filter(f => f.Value === true).length}\nFalse: ${typeFlags.filter(f => f.Value === false).length}`,
                        inline: true
                    }))
                )
                .setFooter({ text: 'Use the buttons below to navigate through pages' })
                .setTimestamp();

            // Prepare pages for each type
            const pages: EmbedBuilder[] = [];
            for (const [type, typeFlags] of Object.entries(groupedFlags)) {
                for (let i = 0; i < typeFlags.length; i += MAX_FLAGS_PER_PAGE) {
                    const chunk = typeFlags.slice(i, i + MAX_FLAGS_PER_PAGE);
                    const embed = new EmbedBuilder()
                        .setColor(config.EMBED_COLOR)
                        .setTitle(`${type} Changes`)
                        .setDescription(
                            chunk.map(flag => {
                                const value = String(flag.Value);
                                const truncatedValue = value.length > MAX_VALUE_LENGTH 
                                    ? value.substring(0, MAX_VALUE_LENGTH) + '...' 
                                    : value;
                                return `\`${flag.name}\`\n↳ Value: ${truncatedValue}${flag.Platform ? `\n↳ Platform: ${flag.Platform}` : ''}`;
                            }).join('\n\n')
                        )
                        .setFooter({ text: `Page ${pages.length + 1} • Type: ${type}` });
                    pages.push(embed);
                }
            }

            // Create navigation buttons
            const buttons = new ActionRowBuilder<ButtonBuilder>()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('first')
                        .setLabel('≪ First')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('previous')
                        .setLabel('◀ Previous')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('next')
                        .setLabel('Next ▶')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('last')
                        .setLabel('Last ≫')
                        .setStyle(ButtonStyle.Primary)
                );

            let currentPage = 0;
            const initialMessage = await interaction.editReply({
                embeds: [summaryEmbed, pages[currentPage]],
                components: [buttons]
            });

            // Create button collector
            const collector = initialMessage.createMessageComponentCollector({
                componentType: ComponentType.Button,
                time: PAGINATION_TIMEOUT
            });

            collector.on('collect', async (i) => {
                if (i.user.id !== interaction.user.id) {
                    await i.reply({ content: '❌ These buttons are not for you!', ephemeral: true });
                    return;
                }

                switch (i.customId) {
                    case 'first':
                        currentPage = 0;
                        break;
                    case 'previous':
                        currentPage = Math.max(0, currentPage - 1);
                        break;
                    case 'next':
                        currentPage = Math.min(pages.length - 1, currentPage + 1);
                        break;
                    case 'last':
                        currentPage = pages.length - 1;
                        break;
                }

                await i.update({
                    embeds: [summaryEmbed, pages[currentPage]],
                    components: [buttons]
                });
            });

            collector.on('end', () => {
                initialMessage.edit({ components: [] }).catch(() => {});
            });

        } catch (error) {
            console.error('Error in newFlags command:', error);
            await interaction.editReply({
                content: '❌ An error occurred while fetching new flags. Please try again later.'
            });
        }
    }
};
