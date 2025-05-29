import { SlashCommandBuilder, SlashCommandSubcommandsOnlyBuilder, SlashCommandOptionsOnlyBuilder, ChatInputCommandInteraction, ButtonInteraction } from 'discord.js';

export interface Command {
    data: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder | SlashCommandSubcommandsOnlyBuilder;
    execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

export interface FlagData {
    name: string;
    Type: string;
    Value: any;
    Description?: string;
    Platform?: string;
    Replacement?: string;
    Outdated?: boolean;
    LastUpdated?: number;
}

export interface ButtonHandlerParams {
    interaction: ButtonInteraction;
    results: FlagCheck[];
}

export interface FlagCheck {
    name: string;
    status: 'valid' | 'outdated' | 'invalid' | 'replaced';
    replacement?: string;
    description?: string;
}

export interface FlagMetadata {
    Type: string;
    Value: any;
    Description?: string;
    Platform?: string;
    Replacement?: string;
    Outdated?: boolean;
}
