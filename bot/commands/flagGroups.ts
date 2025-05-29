import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { githubService } from '../services/githubService';
import { config } from '../config';

interface FlagGroup {
    name: string;
    description: string;
    flags: string[];
    creator: string;
    shared: boolean;
    category: string;
}

const PRESET_GROUPS = {
    'graphics-quality': {
        name: 'Graphics Quality',
        description: 'Flags that control graphics quality and rendering',
        flags: [
            'FFlagGraphicsQualityLevel',
            'FFlagEnableGraphicsQualityReduction',
            'DFIntGraphicsQualityLevel',
            'FFlagGraphicsGLEnableHQShadersExclusion'
        ],
        category: 'Performance'
    },
    'network-optimization': {
        name: 'Network Optimization',
        description: 'Flags for optimizing network performance and reducing latency',
        flags: [
            'DFIntConnectionExtraTicksBehind',
            'DFIntConnectionTicksBehind',
            'DFIntMaxNetworkPackets',
            'FFlagNetworkOptimization'
        ],
        category: 'Network'
    },
    'memory-management': {
        name: 'Memory Management',
        description: 'Flags related to memory usage and optimization',
        flags: [
            'FFlagMemoryPrioritization',
            'DFIntMemoryOptimization',
            'FFlagGarbageCollectionEnabled',
            'DFIntCacheSize'
        ],
        category: 'System'
    }
};

export const flagGroups = {
    data: new SlashCommandBuilder()
        .setName('flaggroups')
        .setDescription('Manage groups of related flags')
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List available flag groups')
                .addStringOption(option =>
                    option
                        .setName('category')
                        .setDescription('Filter by category')
                        .addChoices(
                            { name: 'All Categories', value: 'all' },
                            { name: 'Performance', value: 'Performance' },
                            { name: 'Network', value: 'Network' },
                            { name: 'System', value: 'System' },
                            { name: 'Custom', value: 'Custom' }
                        )
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('view')
                .setDescription('View details of a specific flag group')
                .addStringOption(option =>
                    option
                        .setName('group')
                        .setDescription('Name of the group to view')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription('Create a new flag group')
                .addStringOption(option =>
                    option
                        .setName('name')
                        .setDescription('Name for the new group')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option
                        .setName('description')
                        .setDescription('Description of the group')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option
                        .setName('flags')
                        .setDescription('Comma-separated list of flags')
                        .setRequired(true)
                )
                .addBooleanOption(option =>
                    option
                        .setName('shared')
                        .setDescription('Make this group available to others')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('analyze')
                .setDescription('Analyze values of flags in a group')
                .addStringOption(option =>
                    option
                        .setName('group')
                        .setDescription('Name of the group to analyze')
                        .setRequired(true)
                )
        ),

    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();

        try {
            const subcommand = interaction.options.getSubcommand();

            switch (subcommand) {
                case 'list':
                    await handleList(interaction);
                    break;
                case 'view':
                    await handleView(interaction);
                    break;
                case 'create':
                    await handleCreate(interaction);
                    break;
                case 'analyze':
                    await handleAnalyze(interaction);
                    break;
            }
        } catch (error) {
            console.error('Error in flagGroups command:', error);
            await interaction.editReply({
                content: '❌ An error occurred while managing flag groups. Please try again later.'
            });
        }
    }
};

async function handleList(interaction: ChatInputCommandInteraction) {
    const category = interaction.options.getString('category') || 'all';
    
    // Filter groups by category
    const groups = Object.entries(PRESET_GROUPS)
        .filter(([, group]) => category === 'all' || group.category === category)
        .map(([id, group]) => ({
            name: group.name,
            description: group.description,
            flagCount: group.flags.length,
            category: group.category
        }));

    if (groups.length === 0) {
        await interaction.editReply({
            content: '❌ No flag groups found for the specified category.'
        });
        return;
    }

    const embed = new EmbedBuilder()
        .setColor(config.EMBED_COLOR)
        .setTitle('📑 Available Flag Groups')
        .setDescription(`Found ${groups.length} groups${category !== 'all' ? ` in category: ${category}` : ''}`)
        .addFields(
            groups.map(group => ({
                name: group.name,
                value: `${group.description}\n• Category: ${group.category}\n• Flags: ${group.flagCount}`,
                inline: false
            }))
        )
        .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
}

async function handleView(interaction: ChatInputCommandInteraction) {
    const groupName = interaction.options.getString('group', true);
    const group = Object.values(PRESET_GROUPS).find(g => 
        g.name.toLowerCase() === groupName.toLowerCase()
    );

    if (!group) {
        await interaction.editReply({
            content: `❌ Could not find group: \`${groupName}\``
        });
        return;
    }

    // Fetch current values for flags
    const flagValues = await Promise.all(
        group.flags.map(async flag => {
            const data = await githubService.getFlagData(flag);
            return {
                name: flag,
                value: data?.Value ?? 'Unknown',
                type: data?.Type ?? 'Unknown'
            };
        })
    );

    const embed = new EmbedBuilder()
        .setColor(config.EMBED_COLOR)
        .setTitle(`📋 Flag Group: ${group.name}`)
        .setDescription(group.description)
        .addFields(
            {
                name: 'Category',
                value: group.category,
                inline: true
            },
            {
                name: 'Total Flags',
                value: String(group.flags.length),
                inline: true
            },
            {
                name: 'Current Values',
                value: flagValues
                    .map(f => `\`${f.name}\`: ${String(f.value)}`)
                    .join('\n'),
                inline: false
            }
        )
        .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
}

async function handleCreate(interaction: ChatInputCommandInteraction) {
    const name = interaction.options.getString('name', true);
    const description = interaction.options.getString('description', true);
    const flagsInput = interaction.options.getString('flags', true);
    const shared = interaction.options.getBoolean('shared') ?? false;

    const flags = flagsInput.split(',').map(f => f.trim());

    // Validate flags
    const validFlags = await Promise.all(
        flags.map(async flag => {
            const data = await githubService.getFlagData(flag);
            return { flag, valid: !!data };
        })
    );

    const invalidFlags = validFlags.filter(f => !f.valid).map(f => f.flag);
    if (invalidFlags.length > 0) {
        await interaction.editReply({
            content: `❌ The following flags are invalid:\n${invalidFlags.map(f => `\`${f}\``).join(', ')}`
        });
        return;
    }

    // In a real implementation, you would store this in a database
    const newGroup: FlagGroup = {
        name,
        description,
        flags,
        creator: interaction.user.id,
        shared,
        category: 'Custom'
    };

    const embed = new EmbedBuilder()
        .setColor(config.EMBED_COLOR)
        .setTitle('✅ Flag Group Created')
        .setDescription(description)
        .addFields(
            {
                name: 'Name',
                value: name,
                inline: true
            },
            {
                name: 'Flags',
                value: flags.join('\n'),
                inline: false
            },
            {
                name: 'Visibility',
                value: shared ? 'Shared' : 'Private',
                inline: true
            }
        )
        .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
}

async function handleAnalyze(interaction: ChatInputCommandInteraction) {
    const groupName = interaction.options.getString('group', true);
    const group = Object.values(PRESET_GROUPS).find(g => 
        g.name.toLowerCase() === groupName.toLowerCase()
    );

    if (!group) {
        await interaction.editReply({
            content: `❌ Could not find group: \`${groupName}\``
        });
        return;
    }

    // Fetch and analyze flags
    const flagData = await Promise.all(
        group.flags.map(async flag => {
            const data = await githubService.getFlagData(flag);
            return {
                name: flag,
                ...data
            };
        })
    );

    const analysis = {
        enabled: flagData.filter(f => f.Value === true).length,
        disabled: flagData.filter(f => f.Value === false).length,
        numeric: flagData.filter(f => typeof f.Value === 'number').length,
        other: flagData.filter(f => 
            typeof f.Value !== 'boolean' && typeof f.Value !== 'number'
        ).length
    };

    const embed = new EmbedBuilder()
        .setColor(config.EMBED_COLOR)
        .setTitle(`📊 Group Analysis: ${group.name}`)
        .setDescription(group.description)
        .addFields(
            {
                name: 'Status Overview',
                value: [
                    `✅ Enabled: ${analysis.enabled}`,
                    `❌ Disabled: ${analysis.disabled}`,
                    `🔢 Numeric: ${analysis.numeric}`,
                    `📝 Other: ${analysis.other}`
                ].join('\n'),
                inline: false
            }
        )
        .setTimestamp();

    // Add recommendations based on analysis
    const recommendations = generateGroupRecommendations(group.category, analysis);
    if (recommendations.length > 0) {
        embed.addFields({
            name: '💡 Recommendations',
            value: recommendations.join('\n'),
            inline: false
        });
    }

    await interaction.editReply({ embeds: [embed] });
}

function generateGroupRecommendations(category: string, analysis: any): string[] {
    const recommendations: string[] = [];

    switch (category) {
        case 'Performance':
            if (analysis.disabled > analysis.enabled) {
                recommendations.push('⚠️ Most performance features are disabled - consider enabling some for better performance');
            }
            break;
        case 'Network':
            if (analysis.numeric > 0) {
                recommendations.push('📡 Review numeric values for network optimization');
            }
            break;
        case 'System':
            if (analysis.enabled === 0) {
                recommendations.push('⚙️ Consider enabling some system optimizations');
            }
            break;
    }

    return recommendations;
}
