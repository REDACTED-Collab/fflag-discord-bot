import { ButtonInteraction, EmbedBuilder } from 'discord.js';
import { githubService } from '../services/githubService';
import { createFlagSummary } from '../utils/flagUtils';

interface FlagCheck {
    name: string;
    status: string;
    description?: string;
    value?: any;
    replacement?: string;
}

export async function handleUpdateFlags(interaction: ButtonInteraction, results: FlagCheck[]): Promise<FlagCheck[]> {
    await interaction.deferUpdate();

    const updatedResults: FlagCheck[] = [];
    for (const flag of results) {
        if (flag.status === 'invalid' || flag.status === 'outdated') {
            const data = await githubService.getFlagData(flag.name);
            if (data) {
                updatedResults.push({
                    ...flag,
                    status: 'valid',
                    description: data.Description || flag.description
                });
            } else {
                updatedResults.push(flag);
            }
        } else {
            updatedResults.push(flag);
        }
    }

    const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('🔄 Updated Flag Check Results')
        .setDescription(updatedResults.map(f => createFlagSummary(f)).join('\n\n'))
        .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
    return updatedResults;
}

export async function handleSortAlpha(interaction: ButtonInteraction, results: FlagCheck[]): Promise<FlagCheck[]> {
    await interaction.deferUpdate();

    const sortedResults = [...results].sort((a, b) => a.name.localeCompare(b.name));

    const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('🔤 Flags Sorted Alphabetically')
        .setDescription(sortedResults.map(f => createFlagSummary(f)).join('\n\n'))
        .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
    return sortedResults;
}

export async function handleBeautifulFormat(interaction: ButtonInteraction, results: FlagCheck[]): Promise<void> {
    await interaction.deferUpdate();

    const formattedDescription = results.map(f => createFlagSummary(f)).join('\n\n');

    const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('✨ Beautifully Formatted Flags')
        .setDescription(formattedDescription)
        .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
}

export async function handleRemoveDefaults(interaction: ButtonInteraction, results: FlagCheck[]): Promise<FlagCheck[]> {
    await interaction.deferUpdate();

    const filteredResults = results.filter(flag => {
        if (flag.status !== 'valid') return true;
        // Assuming default values are false, 0, or empty string
        if (flag.value === false || flag.value === 0 || flag.value === '') {
            return false;
        }
        return true;
    });

    const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('🗑️ Flags with Default Values Removed')
        .setDescription(filteredResults.map(f => createFlagSummary(f)).join('\n\n'))
        .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
    return filteredResults;
}
