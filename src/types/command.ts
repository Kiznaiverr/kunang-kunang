import { Message } from 'discord.js';
import { MusicBot } from './bot.js';

/**
 * Interface for Discord bot command structure
 */
export interface Command {
    /** Command name that will be called by users */
    name: string;

    /** Brief description of command function */
    description: string;

    /** Array of command aliases (optional) */
    aliases?: string[];

    /** Main function that executes the command */
    execute: (message: Message, args: string[], bot: MusicBot) => Promise<any>;
}