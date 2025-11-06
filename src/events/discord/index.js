const clientEvents = require('./clientEvents');
const playerEvents = require('./playerEvents');
const errorEvents = require('./errorEvents');

module.exports = {
    registerEvents(client, bot) {
        // Register all Discord events
        clientEvents.registerClientEvents(client, bot);
        playerEvents.registerPlayerEvents(client, bot);
        errorEvents.registerErrorEvents(client, bot);
    }
};