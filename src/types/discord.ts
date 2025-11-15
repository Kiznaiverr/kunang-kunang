import { Guild, VoiceChannel, Message } from 'discord.js';

/**
 * Type definitions for Discord-related interfaces
 */

export interface DiscordMessage {
    content: string;
    author: {
        id: string;
        username: string;
        tag: string;
        bot: boolean;
        toString: () => string;
    };
    guild: Guild | undefined;
    member: {
        voice: {
            channel: VoiceChannel | null;
            channelId: string;
        };
        permissions: {
            has: () => boolean;
        };
        roles: {
            cache: Map<string, any>;
        };
    };
    reply: (content: any) => Promise<Message>;
}