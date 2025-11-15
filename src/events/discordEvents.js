import discordEvents from './discord/index.js';
import { Logger } from '../utils/logging.js';

export default {
    registerEvents(client, bot) {
        Logger.debug('Starting Discord events registration', 'DiscordEvents');
        
        // Use the new modular Discord events structure
        discordEvents.registerEvents(client, bot);
        
        Logger.debug('Discord events registration completed', 'DiscordEvents');
    }
};