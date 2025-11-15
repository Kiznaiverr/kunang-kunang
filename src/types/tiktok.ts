/**
 * Type definitions for TikTok Live integration
 */

export interface TikTokConfig {
    username: string;
    targetGuildId: string;
    targetChannelId: string;
    prefix: string;
    maxReconnectAttempts: number;
    reconnectDelay: number;
    enabled: boolean;
}

export interface TikTokStats {
    commandsProcessed: number;
    messagesReceived: number;
    connectTime: Date | null;
    lastActivity: Date | null;
}

export interface TikTokChatData {
    uniqueId: string;
    comment: string;
    user: {
        isModerator: boolean;
    };
}

export interface TikTokMemberData {
    uniqueId: string;
}

export interface TikTokLikeData {
    uniqueId: string;
}