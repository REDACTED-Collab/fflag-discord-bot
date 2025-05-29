import { StringSelectMenuBuilder, ActionRowBuilder } from 'discord.js';
import { config } from '../config';

export function createPlatformSelect() {
    return new ActionRowBuilder<StringSelectMenuBuilder>()
        .addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('platform_select')
                .setPlaceholder('Select Platform')
                .addOptions([
                    {
                        label: 'PC Client',
                        description: 'Windows/PC Client flags',
                        value: 'PCDesktopClient',
                        emoji: '🖥️'
                    },
                    {
                        label: 'Mac Client',
                        description: 'MacOS Client flags',
                        value: 'MacDesktopClient',
                        emoji: '🍎'
                    },
                    {
                        label: 'Mobile Android',
                        description: 'Android App flags',
                        value: 'AndroidApp',
                        emoji: '📱'
                    },
                    {
                        label: 'Mobile iOS',
                        description: 'iOS App flags',
                        value: 'iOSApp',
                        emoji: '📱'
                    },
                    {
                        label: 'Xbox Client',
                        description: 'Xbox Console flags',
                        value: 'XboxClient',
                        emoji: '🎮'
                    },
                    {
                        label: 'Studio',
                        description: 'Roblox Studio flags',
                        value: 'PCStudioApp',
                        emoji: '🎨'
                    }
                ])
        );
}
