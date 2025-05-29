import { ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';

export function createUpdateFlagsButton() {
    return new ButtonBuilder()
        .setCustomId('update_flags')
        .setLabel('Update Flags')
        .setEmoji('🔄')
        .setStyle(ButtonStyle.Primary);
}

export function createSortAlphaButton() {
    return new ButtonBuilder()
        .setCustomId('sort_alpha')
        .setLabel('Sort A-Z')
        .setEmoji('🔡')
        .setStyle(ButtonStyle.Secondary);
}

export function createBeautifulFormatButton() {
    return new ButtonBuilder()
        .setCustomId('beautiful_format')
        .setLabel('Beautify')
        .setEmoji('✨')
        .setStyle(ButtonStyle.Success);
}

export function createRemoveDefaultButton() {
    return new ButtonBuilder()
        .setCustomId('remove_defaults')
        .setLabel('Remove Defaults')
        .setEmoji('🗑️')
        .setStyle(ButtonStyle.Danger);
}

export function createFlagActionButtonsRow() {
    const updateBtn = createUpdateFlagsButton();
    const sortBtn = createSortAlphaButton();
    const beautifyBtn = createBeautifulFormatButton();
    const removeDefaultsBtn = createRemoveDefaultButton();

    return new ActionRowBuilder<ButtonBuilder>().addComponents(
        updateBtn,
        sortBtn,
        beautifyBtn,
        removeDefaultsBtn
    );
}
