import { SlashCommandBuilder, SlashCommandOptionsOnlyBuilder, SlashCommandSubcommandsOnlyBuilder, ChatInputCommandInteraction } from 'discord.js';
import { checkFlag } from './checkFlag';
import { newFlags } from './newFlags';
import { findFlag } from './findFlag';
import { convertJson } from './convertJson';
import { trackFlag } from './trackFlag';
import { compareFlags } from './compareFlags';
import { analyzeFlags } from './analyzeFlags';
import { help } from './help';
import { optimizeFlags } from './optimizeFlags';
import { exportFlags } from './exportFlags';
import { flagStats } from './flagStats';
import { subscribeAlerts } from './subscribeAlerts';
import { flagHistory } from './flagHistory';
import { flagGroups } from './flagGroups';
import { owner } from './owner';
import { checkList } from './checkList';

export interface Command {
    data: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder | SlashCommandSubcommandsOnlyBuilder;
    execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

export const commands: Command[] = [
    checkFlag,
    newFlags,
    findFlag,
    convertJson,
    trackFlag,
    compareFlags,
    analyzeFlags,
    help,
    optimizeFlags,
    exportFlags,
    flagStats,
    subscribeAlerts,
    flagHistory,
    flagGroups,
    owner,
    checkList
];
