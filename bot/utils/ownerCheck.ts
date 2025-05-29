import { ChatInputCommandInteraction } from 'discord.js';
import { config } from '../config';

export function isOwner(interaction: ChatInputCommandInteraction): boolean {
    return interaction.user.id === config.OWNER_ID;
}

export async function checkOwner(interaction: ChatInputCommandInteraction): Promise<boolean> {
    if (!isOwner(interaction)) {
        await interaction.reply({
            content: '❌ This command is only available to the bot owner.',
            ephemeral: true
        });
        return false;
    }
    return true;
}
