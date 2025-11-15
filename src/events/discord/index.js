import clientEvents from './clientEvents.js';
import playerEvents from './playerEvents.js';
import errorEvents from './errorEvents.js';
import { Logger } from '../../utils/logging.js';

export default {
    registerEvents(client, bot) {
        Logger.debug('Initializing Discord events registration', 'DiscordEvents');
        
        // Register all Discord events
        clientEvents.registerClientEvents(client, bot);
        playerEvents.registerPlayerEvents(client, bot);
        errorEvents.registerErrorEvents(client, bot);
        
        Logger.debug('All Discord events registered successfully', 'DiscordEvents');
    }
};