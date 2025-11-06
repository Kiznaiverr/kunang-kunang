const discordEvents = require('./discord');

module.exports = {
    registerEvents(client, bot) {
        // Use the new modular Discord events structure
        discordEvents.registerEvents(client, bot);
    }
};