import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, AttachmentBuilder } from 'discord.js';
import { githubService } from '../services/githubService';
import { config } from '../config';
import { FlagData } from '../types';

export const exportFlags = {
    data: new SlashCommandBuilder()
        .setName('exportflags')
        .setDescription('Export flags to different formats')
        .addStringOption(option =>
            option
                .setName('format')
                .setDescription('Export format')
                .setRequired(true)
                .addChoices(
                    { name: 'JSON', value: 'json' },
                    { name: 'CSV', value: 'csv' },
                    { name: 'Markdown', value: 'md' }
                )
        )
        .addStringOption(option =>
            option
                .setName('filter')
                .setDescription('Filter flags (e.g., "Graphics", "Network")')
                .setRequired(false)
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
                    { name: 'Console', value: 'ConsoleClient' },
                    { name: 'Studio', value: 'StudioClient' }
                )
        ),

    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();

        try {
            const format = interaction.options.getString('format', true);
            const filter = interaction.options.getString('filter');
            const platform = interaction.options.getString('platform') || 'all';

            // Get flags based on filter
            let flags: FlagData[] = [];
            if (filter) {
                flags = await githubService.searchFlags(filter, platform === 'StudioClient');
            } else {
                flags = await githubService.getNewFlags(24); // Get last 24 hours of flags as default
            }

            // Filter by platform if specified
            if (platform !== 'all') {
                flags = flags.filter(flag => flag.Platform === platform);
            }

            if (flags.length === 0) {
                await interaction.editReply({
                    content: '❌ No flags found matching your criteria.'
                });
                return;
            }

            // Convert flags to specified format
            let content = '';
            let filename = '';
            const currentTime = Date.now();
            
            switch (format) {
                case 'json':
                    content = JSON.stringify(flags, null, 2);
                    filename = 'flags.json';
                    break;

                case 'csv':
                    content = 'Name,Type,Value,Platform,LastUpdated\n' +
                        flags.map(flag => 
                            `${flag.name},${flag.Type},${flag.Value},${flag.Platform || 'All'},${new Date(flag.LastUpdated || currentTime).toISOString()}`
                        ).join('\n');
                    filename = 'flags.csv';
                    break;

                case 'md':
                    content = '# Roblox FFlags Export\n\n' +
                        '| Name | Type | Value | Platform | Last Updated |\n' +
                        '|------|------|--------|----------|--------------||\n' +
                        flags.map(flag => 
                            `| ${flag.name} | ${flag.Type} | ${flag.Value} | ${flag.Platform || 'All'} | ${new Date(flag.LastUpdated || currentTime).toLocaleString()} |`
                        ).join('\n');
                    filename = 'flags.md';
                    break;
            }

            // Create file attachment
            const buffer = Buffer.from(content, 'utf-8');
            const attachment = new AttachmentBuilder(buffer, { name: filename });

            // Create response embed
            const embed = new EmbedBuilder()
                .setColor(config.EMBED_COLOR)
                .setTitle('📤 Flags Export Complete')
                .setDescription(
                    `Successfully exported ${flags.length} flags to ${format.toUpperCase()} format.\n\n` +
                    `**Export Details:**\n` +
                    `• Format: ${format.toUpperCase()}\n` +
                    `• Total Flags: ${flags.length}\n` +
                    (filter ? `• Filter: "${filter}"\n` : '') +
                    (platform !== 'all' ? `• Platform: ${platform}\n` : '') +
                    `\nThe exported file is attached below.`
                )
                .setTimestamp();

            // Add sample preview if not too long
            if (flags.length > 0 && flags.length <= 5) {
                embed.addFields({
                    name: 'Preview',
                    value: flags.slice(0, 5).map(flag => 
                        `\`${flag.name}\`: ${String(flag.Value).substring(0, 30)}`
                    ).join('\n'),
                    inline: false
                });
            }

            await interaction.editReply({
                embeds: [embed],
                files: [attachment]
            });

        } catch (error) {
            console.error('Error in exportFlags command:', error);
            await interaction.editReply({
                content: '❌ An error occurred while exporting flags. Please try again later.'
            });
        }
    }
};
