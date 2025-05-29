import dotenv from 'dotenv';
dotenv.config();

if (!process.env.DISCORD_TOKEN) {
    throw new Error('DISCORD_TOKEN is required in .env file');
}

export const config = {
    DISCORD_TOKEN: process.env.DISCORD_TOKEN,
    GUILD_ID: process.env.GUILD_ID || '',
    OWNER_ID: process.env.OWNER_ID || '', // Add owner ID for owner-only commands
    GITHUB_API_BASE: 'https://raw.githubusercontent.com/MaximumADHD/Roblox-FFlag-Tracker/main',
    EMBED_COLOR: 0x0099ff,
    DEFAULT_COOLDOWN: 3000, // 3 seconds
    PLATFORMS: [
        'PCDesktopClient',
        'MacDesktopClient',
        'AndroidApp',
        'iOSApp',
        'XboxClient',
        'PCStudioApp'
    ]
};
