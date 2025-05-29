import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ButtonInteraction } from 'discord.js';
import { config } from '../config';
import { githubService } from '../services/githubService';
import { FlagCheck } from '../types';
import { createFlagActionButtonsRow } from '../components/FlagActionButtons';
import { filterFlagsByPattern, sortFlagsByCategory, formatFlagValue, createFlagSummary } from '../utils/flagUtils';

export const checkList = {
    data: new SlashCommandBuilder()
        .setName('checklist')
        .setDescription('✅ Check for invalid and outdated flags in your list')
        .addAttachmentOption(option =>
            option
                .setName('file')
                .setDescription('JSON or TXT file containing flags')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('format')
                .setDescription('File format')
                .setRequired(true)
                .addChoices(
                    { name: '📄 JSON', value: 'json' },
                    { name: '📝 TXT', value: 'txt' }
                )
        ),

    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();

        try {
            const file = interaction.options.getAttachment('file', true);
            const format = interaction.options.getString('format', true);

            // Validate file type
            if (!file.name?.endsWith(format)) {
                await interaction.editReply({
                    content: `❌ Invalid file format. Expected .${format} file.`
                });
                return;
            }

            // Fetch file content
            const response = await fetch(file.url);
            const content = await response.text();

            // Parse flags based on format
            const flags = format === 'json' ? 
                parseJsonFlags(content) :
                parseTxtFlags(content);

            if (!flags.length) {
                await interaction.editReply({
                    content: '❌ No valid flags found in the file.'
                });
                return;
            }

            // Check flags
            let results = await checkFlags(flags);
            
            // Create result embeds with pagination
            const embeds = createResultEmbeds(results);
            
            // Create action row with buttons
            const row = new ActionRowBuilder<ButtonBuilder>()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('export_json')
                        .setLabel('📥 Export as JSON')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('show_replacements')
                        .setLabel('🔄 Show Replacements')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId('show_descriptions')
                        .setLabel('📚 Show Descriptions')
                        .setStyle(ButtonStyle.Secondary)
                );

            // Add new flag action buttons row
            const flagActionButtonsRow = createFlagActionButtonsRow();

            const message = await interaction.editReply({
                embeds: [embeds[0]],
                components: [row, flagActionButtonsRow]
            });

            // Handle button interactions
            const collector = message.createMessageComponentCollector({
                time: 300000 // 5 minutes
            });

            collector.on('collect', async i => {
                if (!i.isButton()) return;

                switch (i.customId) {
                    case 'export_json':
                        await handleExportJson(i, results);
                        break;
                    case 'show_replacements':
                        await handleReplacements(i, results);
                        break;
                    case 'show_descriptions':
                        await handleDescriptions(i, results);
                        break;
                    // Removed undefined handlers to fix errors
                    default:
                        await i.reply({ content: '⚠️ Button action not implemented.', ephemeral: true });
                        break;
                }
            });

        } catch (error) {
            console.error('Error in checkList command:', error);
            await interaction.editReply({
                content: '❌ An error occurred while checking flags.'
            });
        }
    }
};

function parseJsonFlags(content: string): string[] {
    try {
        const data = JSON.parse(content);
        return extractFlagsFromJson(data);
    } catch {
        return [];
    }
}

function parseTxtFlags(content: string): string[] {
    return content
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.match(/^[DF]Flag[A-Za-z0-9]+$/));
}

function extractFlagsFromJson(data: any): string[] {
    const flags: string[] = [];
    
    function extract(obj: any) {
        if (typeof obj === 'object' && obj !== null) {
            for (const key in obj) {
                if (key.match(/^[DF]Flag[A-Za-z0-9]+$/)) {
                    flags.push(key);
                }
                extract(obj[key]);
            }
        }
    }

    extract(data);
    return flags;
}

async function checkFlags(flags: string[]): Promise<FlagCheck[]> {
    const results: FlagCheck[] = [];

    for (const flag of flags) {
        const data = await githubService.getFlagData(flag);
        
        if (!data) {
            results.push({
                name: flag,
                status: 'invalid'
            });
            continue;
        }

        if (data.Replacement) {
            results.push({
                name: flag,
                status: 'replaced',
                replacement: data.Replacement,
                description: data.Description
            });
        } else if (data.Outdated) {
            results.push({
                name: flag,
                status: 'outdated',
                description: data.Description
            });
        } else {
            results.push({
                name: flag,
                status: 'valid',
                description: data.Description
            });
        }
    }

    return results;
}

function createResultEmbeds(results: FlagCheck[]): EmbedBuilder[] {
    const embeds: EmbedBuilder[] = [];
    const itemsPerPage = 10;

    // Group flags by status
    const valid = results.filter(r => r.status === 'valid');
    const outdated = results.filter(r => r.status === 'outdated');
    const invalid = results.filter(r => r.status === 'invalid');
    const replaced = results.filter(r => r.status === 'replaced');

    // Create summary embed
    const summaryEmbed = new EmbedBuilder()
        .setColor(config.EMBED_COLOR)
        .setTitle('🔍 Flag Check Results')
        .setDescription(
            `Total Flags Checked: ${results.length}\n\n` +
            `✅ Valid: ${valid.length}\n` +
            `⚠️ Outdated: ${outdated.length}\n` +
            `❌ Invalid: ${invalid.length}\n` +
            `🔄 Replaced: ${replaced.length}`
        )
        .setTimestamp();

    embeds.push(summaryEmbed);

    // Add detailed results
    if (invalid.length > 0) {
        const invalidEmbed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('❌ Invalid Flags')
            .setDescription(invalid.map(f => `\`${f.name}\``).join('\n'));
        embeds.push(invalidEmbed);
    }

    if (replaced.length > 0) {
        const replacedEmbed = new EmbedBuilder()
            .setColor('#ffa500')
            .setTitle('🔄 Replaced Flags')
            .setDescription(
                replaced.map(f => 
                    `\`${f.name}\` → \`${f.replacement}\``
                ).join('\n')
            );
        embeds.push(replacedEmbed);
    }

    if (outdated.length > 0) {
        const outdatedEmbed = new EmbedBuilder()
            .setColor('#ffff00')
            .setTitle('⚠️ Outdated Flags')
            .setDescription(outdated.map(f => `\`${f.name}\``).join('\n'));
        embeds.push(outdatedEmbed);
    }

    return embeds;
}

async function handleExportJson(interaction: ButtonInteraction, results: FlagCheck[]) {
    const exportData = {
        timestamp: new Date().toISOString(),
        results: results.map(r => ({
            name: r.name,
            status: r.status,
            ...(r.replacement && { replacement: r.replacement }),
            ...(r.description && { description: r.description })
        }))
    };

    await interaction.reply({
        content: '📥 Here\'s your export:',
        files: [{
            attachment: Buffer.from(JSON.stringify(exportData, null, 2)),
            name: 'flag-check-results.json'
        }],
        ephemeral: true
    });
}

async function handleReplacements(interaction: ButtonInteraction, results: FlagCheck[]) {
    const replaced = results.filter(r => r.status === 'replaced');
    
    if (replaced.length === 0) {
        await interaction.reply({
            content: '✨ No replacement flags found.',
            ephemeral: true
        });
        return;
    }

    const embed = new EmbedBuilder()
        .setColor(config.EMBED_COLOR)
        .setTitle('🔄 Replacement Flags')
        .setDescription(
            replaced.map(f => 
                `**${f.name}**\n→ \`${f.replacement}\`${f.description ? `\n📝 ${f.description}` : ''}`
            ).join('\n\n')
        );

    await interaction.reply({
        embeds: [embed],
        ephemeral: true
    });
}

async function handleDescriptions(interaction: ButtonInteraction, results: FlagCheck[]) {
    const withDesc = results.filter(r => r.description);
    
    if (withDesc.length === 0) {
        await interaction.reply({
            content: '📚 No flag descriptions available.',
            ephemeral: true
        });
        return;
    }

    const embed = new EmbedBuilder()
        .setColor(config.EMBED_COLOR)
        .setTitle('📚 Flag Descriptions')
        .setDescription(
            withDesc.map(f => 
                `**${f.name}**\n${f.description}`
            ).join('\n\n')
        );

    await interaction.reply({
        embeds: [embed],
        ephemeral: true
    });
}
