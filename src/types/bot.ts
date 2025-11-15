import { Client, Collection } from 'discord.js';
import { Player } from 'discord-player';
import TikTokBridge from '../utils/TikTokBridge.js';
import OverlayServer from '../web/server.js';
import { Command } from './command.js';

/**
 * Interface for the main MusicBot class
 */
export interface MusicBot {
    /** Discord.js client instance */
    client: Client;

    /** Discord-player instance */
    player: Player;

    /** Collection of bot commands */
    commands: Collection<string, Command>;

    /** Bot command prefix */
    prefix: string;

    /** TikTok live bridge instance */
    tiktokBridge: TikTokBridge | null;

    /** Web overlay server instance */
    overlayServer: OverlayServer | null;
}