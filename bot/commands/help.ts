import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuInteraction, ComponentType } from 'discord.js';
import { config } from '../config';
import { CommandCategories } from '../types/help';

const commandCategories: CommandCategories = {
    'Core Commands': {
        emoji: '⚡',
        commands: {
            'checkflag': {
                description: 'Look up specific flag details',
                usage: '/checkflag <flag>',
                example: '/checkflag DFlagEnableNewGui',
                options: [
                    { name: 'flag', description: 'The flag name to check' },
                    { name: 'platform', description: 'Platform to check (PC, Mobile, etc)' }
                ]
            },
            'findflag': {
                description: 'Search for flags by keyword',
                usage: '/findflag <keyword>',
                example: '/findflag graphics',
                options: [
                    { name: 'keyword', description: 'Keyword to search for' },
                    { name: 'platform', description: 'Filter by platform' }
                ]
            },
            'newfflags': {
                description: 'Browse recent flag changes with pagination',
                usage: '/newfflags [hours] [type]',
                example: '/newfflags hours:24 type:all',
                options: [
                    { name: 'hours', description: 'How many hours back to look' },
                    { name: 'type', description: 'Type of flags to show' }
                ]
            }
        }
    },
    'Analysis Tools': {
        emoji: '📊',
        commands: {
            'analyzeflags': {
                description: 'Analyze patterns and trends in flags',
                usage: '/analyzeflags <pattern> [detailed]',
                example: '/analyzeflags pattern:Graphics detailed:true'
            },
            'flagstats': {
                description: 'Get detailed flag statistics',
                usage: '/flagstats [timeframe] [include_patterns]',
                example: '/flagstats timeframe:30d patterns:true'
            },
            'compareflags': {
                description: 'Compare flags across platforms',
                usage: '/compareflags <flag> [platforms]',
                example: '/compareflags DFlagGraphicsQuality platforms:PC,Mobile'
            }
        }
    },
    'Management': {
        emoji: '🔧',
        commands: {
            'flaggroups': {
                description: 'Manage collections of related flags',
                usage: '/flaggroups <action>',
                example: '/flaggroups create name:GraphicsFlags',
                subcommands: [
                    'list - View available groups',
                    'view - See group details',
                    'create - Make custom groups',
                    'analyze - Get group statistics'
                ]
            },
            'checklist': {
                description: '✅ Check for invalid and outdated flags in your list',
                usage: '/checklist <file> <format>',
                example: '/checklist file:flags.json format:json',
                features: [
                    '📄 Supports JSON and TXT formats',
                    '🔄 Detects newer versions of FastFlags',
                    '📊 Provides detailed analysis'
                ]
            }
        }
    },
    'Tracking & Export': {
        emoji: '📥',
        commands: {
            'trackflag': {
                description: 'Track specific flag changes',
                usage: '/trackflag <flag> [channel]',
                example: '/trackflag DFlagNewUI channel:#flag-updates'
            },
            'exportflags': {
                description: 'Export flags to different formats',
                usage: '/exportflags [format] [filter]',
                example: '/exportflags format:json filter:graphics'
            },
            'subscribealerts': {
                description: 'Set up change notifications',
                usage: '/subscribealerts <pattern>',
                example: '/subscribealerts pattern:Graphics'
            }
        }
    },
    'Utilities': {
        emoji: '🛠️',
        commands: {
            'convertjson': {
                description: 'Convert between different FFlag formats',
                usage: '/convertjson <input> <format>',
                example: '/convertjson file:flags.json format:lua'
            },
            'flaghistory': {
                description: 'View historical changes for a flag',
                usage: '/flaghistory <flag> [days]',
                example: '/flaghistory DFlagNewUI days:30'
            }
        }
    }
};

export const help = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('📚 Get detailed help about commands')
        .addStringOption(option =>
            option
                .setName('command')
                .setDescription('Specific command to get help for')
                .setRequired(false)
        ),

    async execute(interaction: ChatInputCommandInteraction) {
        const commandName = interaction.options.getString('command');

        if (commandName) {
            await showCommandHelp(interaction, commandName);
            return;
        }

        const row = new ActionRowBuilder<StringSelectMenuBuilder>()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('help_category')
                    .setPlaceholder('Select a category')
                    .addOptions(
                        Object.entries(commandCategories).map(([name, category]) => ({
                            label: name,
                            description: `View ${name.toLowerCase()} commands`,
                            value: name,
                            emoji: category.emoji
                        }))
                    )
            );

        const embed = new EmbedBuilder()
            .setColor(config.EMBED_COLOR)
            .setTitle('🤖 FFlag Bot Help')
            .setDescription(
                '**Welcome to the FFlag Bot Help System!**\n\n' +
                'Select a category from the dropdown menu below to view available commands.\n\n' +
                '**Categories:**\n' +
                Object.entries(commandCategories)
                    .map(([name, category]) => `${category.emoji} **${name}** - ${Object.keys(category.commands).length} commands`)
                    .join('\n')
            )
            .setFooter({ text: 'Tip: Use /help <command> for detailed information about a specific command' });

        const message = await interaction.reply({
            embeds: [embed],
            components: [row],
            fetchReply: true
        });

        const collector = message.createMessageComponentCollector({
            componentType: ComponentType.StringSelect,
            time: 300000
        });

        collector.on('collect', async (i: StringSelectMenuInteraction) => {
            if (i.customId === 'help_category') {
                const category = i.values[0];
                const categoryData = commandCategories[category];

                const categoryEmbed = new EmbedBuilder()
                    .setColor(config.EMBED_COLOR)
                    .setTitle(`${categoryData.emoji} ${category}`)
                    .setDescription(
                        Object.entries(categoryData.commands)
                            .map(([name, cmd]) => {
                                let text = `**/${name}**\n${cmd.description}\n` +
                                    `Usage: \`${cmd.usage}\`\n` +
                                    `Example: \`${cmd.example}\`\n`;

                                if (cmd.subcommands) {
                                    text += `\nSubcommands:\n${cmd.subcommands.map(sub => `• ${sub}`).join('\n')}\n`;
                                }
                                if (cmd.features) {
                                    text += `\nFeatures:\n${cmd.features.map(f => `• ${f}`).join('\n')}\n`;
                                }
                                if (cmd.options) {
                                    text += `\nOptions:\n${cmd.options.map(opt => `• ${opt.name}: ${opt.description}`).join('\n')}\n`;
                                }
                                return text;
                            })
                            .join('\n---\n')
                    )
                    .setFooter({ text: 'Use /help <command> for more detailed information about a specific command' });

                await i.update({ embeds: [categoryEmbed], components: [row] });
            }
        });
    }
};

async function showCommandHelp(interaction: ChatInputCommandInteraction, commandName: string) {
    let found = false;

    for (const [categoryName, category] of Object.entries(commandCategories)) {
        const commandData = category.commands[commandName];
        if (commandData) {
            const embed = new EmbedBuilder()
                .setColor(config.EMBED_COLOR)
                .setTitle(`Command Help: /${commandName}`)
                .setDescription(commandData.description)
                .addFields(
                    { name: '📝 Usage', value: `\`${commandData.usage}\`` },
                    { name: '💡 Example', value: `\`${commandData.example}\`` }
                );

            if (commandData.options) {
                embed.addFields({
                    name: '⚙️ Options',
                    value: commandData.options.map(opt => `• **${opt.name}**: ${opt.description}`).join('\n')
                });
            }

            if (commandData.subcommands) {
                embed.addFields({
                    name: '🔧 Subcommands',
                    value: commandData.subcommands.join('\n')
                });
            }

            if (commandData.features) {
                embed.addFields({
                    name: '✨ Features',
                    value: commandData.features.join('\n')
                });
            }

            await interaction.reply({ embeds: [embed] });
            found = true;
            break;
        }
    }

    if (!found) {
        await interaction.reply({
            content: `❌ Command \`/${commandName}\` not found. Use \`/help\` to see all available commands.`,
            ephemeral: true
        });
    }
}
