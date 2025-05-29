interface CommandOption {
    name: string;
    description: string;
}

interface CommandInfo {
    description: string;
    usage: string;
    example: string;
    options?: CommandOption[];
    subcommands?: string[];
    features?: string[];
}

interface CategoryInfo {
    emoji: string;
    commands: {
        [key: string]: CommandInfo;
    };
}

export interface CommandCategories {
    [key: string]: CategoryInfo;
}
