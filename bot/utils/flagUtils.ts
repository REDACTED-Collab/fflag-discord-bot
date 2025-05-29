import { getFlagDescription, getFlagCategory } from '../data/flagDescriptions';

export interface FlagInfo {
    name: string;
    value: any;
    category: string;
    description: string;
    platform?: string;
    type?: string;
}

export function categorizeFlagsByType(flags: string[]): { [key: string]: string[] } {
    const categorized: { [key: string]: string[] } = {
        'DFlags': [],
        'FFlags': [],
        'Other': []
    };

    flags.forEach(flag => {
        if (flag.startsWith('DFlag')) {
            categorized['DFlags'].push(flag);
        } else if (flag.startsWith('FFlag')) {
            categorized['FFlags'].push(flag);
        } else {
            categorized['Other'].push(flag);
        }
    });

    return categorized;
}

export function enrichFlagData(flagName: string, value: any, platform?: string): FlagInfo {
    return {
        name: flagName,
        value: value,
        category: getFlagCategory(flagName),
        description: getFlagDescription(flagName),
        platform: platform,
        type: getFlagType(flagName)
    };
}

export function getFlagType(flagName: string): string {
    if (flagName.startsWith('DFlag')) return 'Dynamic Flag';
    if (flagName.startsWith('FFlag')) return 'Fast Flag';
    return 'Unknown Flag Type';
}

export function filterFlagsByPattern(flags: string[], pattern: string): string[] {
    const lowerPattern = pattern.toLowerCase();
    return flags.filter(flag => 
        flag.toLowerCase().includes(lowerPattern) ||
        getFlagDescription(flag).toLowerCase().includes(lowerPattern) ||
        getFlagCategory(flag).toLowerCase().includes(lowerPattern)
    );
}

export function sortFlagsByCategory(flags: FlagInfo[]): { [key: string]: FlagInfo[] } {
    const sorted: { [key: string]: FlagInfo[] } = {};

    flags.forEach(flag => {
        const category = flag.category || 'Uncategorized';
        if (!sorted[category]) {
            sorted[category] = [];
        }
        sorted[category].push(flag);
    });

    // Sort categories alphabetically
    return Object.keys(sorted)
        .sort()
        .reduce((obj: { [key: string]: FlagInfo[] }, key) => {
            obj[key] = sorted[key];
            return obj;
        }, {});
}

export function formatFlagValue(value: any): string {
    if (typeof value === 'boolean') {
        return value ? '✅ true' : '❌ false';
    }
    if (typeof value === 'number') {
        return `📊 ${value}`;
    }
    if (typeof value === 'string') {
        return `📝 "${value}"`;
    }
    return String(value);
}

export function getFlagEmoji(flagName: string): string {
    const category = getFlagCategory(flagName);
    const emojis: { [key: string]: string } = {
        'Graphics': '🎨',
        'Network': '🌐',
        'UI': '🖥️',
        'Security': '🔒',
        'Audio': '🔊',
        'Physics': '⚡',
        'Memory': '💾',
        'Developer': '🛠️',
        'Platform': '📱',
        'Experimental': '🧪',
        'Analytics': '📊',
        'Social': '👥',
        'GameServices': '🎮'
    };

    return emojis[category] || '🔧';
}

export function createFlagSummary(flag: FlagInfo): string {
    const emoji = getFlagEmoji(flag.name);
    const formattedValue = formatFlagValue(flag.value);
    
    return [
        `${emoji} **${flag.name}**`,
        `Type: ${flag.type}`,
        `Category: ${flag.category}`,
        `Value: ${formattedValue}`,
        flag.description ? `Description: ${flag.description}` : null,
        flag.platform ? `Platform: ${flag.platform}` : null
    ]
        .filter(line => line !== null)
        .join('\n');
}

export function groupFlagsByPrefix(flags: string[]): { [key: string]: string[] } {
    const groups: { [key: string]: string[] } = {};
    
    flags.forEach(flag => {
        // Extract prefix (everything before the first uppercase letter after D/FFlag)
        const match = flag.match(/^[DF]Flag([A-Z][a-z]+)/);
        if (match) {
            const prefix = match[1];
            if (!groups[prefix]) {
                groups[prefix] = [];
            }
            groups[prefix].push(flag);
        } else {
            if (!groups['Other']) {
                groups['Other'] = [];
            }
            groups['Other'].push(flag);
        }
    });

    return groups;
}
