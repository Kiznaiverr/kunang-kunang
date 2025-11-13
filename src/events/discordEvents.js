const discordEvents = require('./discord');
const { Logger } = require('../utils/logging');

module.exports = {
    registerEvents(client, bot) {
        Logger.debug('Starting Discord events registration', 'DiscordEvents');
        
        // Use the new modular Discord events structure
        discordEvents.registerEvents(client, bot);
        
        Logger.debug('Discord events registration completed', 'DiscordEvents');
    }
};