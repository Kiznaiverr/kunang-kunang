import clientEvents from './discord/clientEvents.js';
import playerEvents from './discord/playerEvents.js';
import errorEvents from './discord/errorEvents.js';
import { Logger } from '../utils/logging.js';
import { Client } from 'discord.js';
import { MusicBot } from '../types/bot.js';

export default {
    registerEvents(client: Client, bot: MusicBot) {
        Logger.debug('Starting Discord events registration', 'DiscordEvents');

        // Register all Discord events
        clientEvents.registerClientEvents(client, bot);
        playerEvents.registerPlayerEvents(client, bot);
        errorEvents.registerErrorEvents(client, bot);

        Logger.debug('Discord events registration completed', 'DiscordEvents');
    }
};