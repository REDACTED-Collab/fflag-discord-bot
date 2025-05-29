import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { config } from '../config';

interface ParsedFlag {
    name: string;
    value: string | boolean | number;
}

export const convertJson = {
    data: new SlashCommandBuilder()
        .setName('convertjson')
        .setDescription('Convert between different FFlag formats')
        .addStringOption(option =>
            option
                .setName('input')
                .setDescription('Input text to convert (comma-separated key=value or JSON)')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('format')
                .setDescription('Output format')
                .setRequired(true)
                .addChoices(
                    { name: 'JSON', value: 'json' },
                    { name: 'INI', value: 'ini' },
                    { name: 'ClientSettings', value: 'clientsettings' }
                )
        ),

    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();

        try {
            const input = interaction.options.getString('input', true);
            const format = interaction.options.getString('format', true);

            // Parse input
            const flags = parseInput(input);

            if (flags.length === 0) {
                await interaction.editReply({
                    content: '❌ No valid flags found in input. Please check your format and try again.'
                });
                return;
            }

            // Convert to requested format
            const converted = convertToFormat(flags, format);

            const embed = new EmbedBuilder()
                .setColor(config.EMBED_COLOR)
                .setTitle('🔄 Format Conversion')
                .setDescription('Successfully converted flags to requested format.')
                .addFields({
                    name: `Converted Output (${format.toUpperCase()})`,
                    value: `\`\`\`${format === 'json' ? 'json' : 'ini'}\n${converted}\n\`\`\``,
                })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('Error in convertJson command:', error);
            await interaction.editReply({
                content: '❌ An error occurred while converting the format. Please check your input and try again.'
            });
        }
    }
};

function parseInput(input: string): ParsedFlag[] {
    const flags: ParsedFlag[] = [];

    // Try parsing as JSON first
    try {
        const jsonData = JSON.parse(input);
        Object.entries(jsonData).forEach(([key, value]) => {
            if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
                flags.push({ name: key, value });
            }
        });
        return flags;
    } catch {
        // If not JSON, try parsing as comma-separated key=value pairs
        const pairs = input.split(',').map(pair => pair.trim());
        pairs.forEach(pair => {
            const [key, value] = pair.split('=').map(part => part.trim());
            if (key && value !== undefined) {
                // Convert value to appropriate type
                let parsedValue: string | boolean | number = value;
                if (value.toLowerCase() === 'true') parsedValue = true;
                else if (value.toLowerCase() === 'false') parsedValue = false;
                else if (!isNaN(Number(value))) parsedValue = Number(value);
                
                flags.push({ name: key, value: parsedValue });
            }
        });
    }

    return flags;
}

function convertToFormat(flags: ParsedFlag[], format: string): string {
    switch (format) {
        case 'json':
            const jsonObj = flags.reduce((acc, flag) => {
                acc[flag.name] = flag.value;
                return acc;
            }, {} as Record<string, any>);
            return JSON.stringify(jsonObj, null, 2);

        case 'ini':
            return flags
                .map(flag => `${flag.name}=${flag.value}`)
                .join('\n');

        case 'clientsettings':
            // Format used in Roblox ClientSettings
            const settingsObj = flags.reduce((acc, flag) => {
                acc[flag.name] = {
                    Value: flag.value,
                    Type: typeof flag.value
                };
                return acc;
            }, {} as Record<string, any>);
            return JSON.stringify(settingsObj, null, 2);

        default:
            throw new Error(`Unsupported format: ${format}`);
    }
}
