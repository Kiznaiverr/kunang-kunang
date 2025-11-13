const clientEvents = require('./clientEvents');
const playerEvents = require('./playerEvents');
const errorEvents = require('./errorEvents');
const { Logger } = require('../../utils/logging');

module.exports = {
    registerEvents(client, bot) {
        Logger.debug('Initializing Discord events registration', 'DiscordEvents');
        
        // Register all Discord events
        clientEvents.registerClientEvents(client, bot);
        playerEvents.registerPlayerEvents(client, bot);
        errorEvents.registerErrorEvents(client, bot);
        
        Logger.debug('All Discord events registered successfully', 'DiscordEvents');
    }
};