import { ButtonBuilder, ButtonStyle, ActionRowBuilder, ButtonInteraction } from 'discord.js';

export function createCopyButton(customId: string, label: string = 'Copy Value') {
    return new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`copy_${customId}`)
                .setLabel(label)
                .setEmoji('📋')
                .setStyle(ButtonStyle.Secondary)
        );
}

export function createCopyButtons(data: { [key: string]: any }, prefix: string = 'copy') {
    const buttons: ButtonBuilder[] = [];
    
    Object.entries(data).forEach(([key, value], index) => {
        if (buttons.length >= 5) return; // Discord max 5 buttons per row
        
        buttons.push(
            new ButtonBuilder()
                .setCustomId(`${prefix}_${key}`)
                .setLabel(`Copy ${key}`)
                .setEmoji('📋')
                .setStyle(ButtonStyle.Secondary)
        );
    });

    return new ActionRowBuilder<ButtonBuilder>().addComponents(buttons);
}

export async function handleCopyButton(interaction: ButtonInteraction, value: string) {
    await interaction.reply({
        content: `📋 Value copied to clipboard:\n\`\`\`\n${value}\n\`\`\``,
        ephemeral: true
    });
}
