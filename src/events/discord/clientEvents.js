const { Logger } = require('../../utils/logging');

module.exports = {
    registerClientEvents(client, bot) {
        // Message command handling
        client.on('messageCreate', (message) => {
            if (!message.content.startsWith(bot.prefix) || message.author.bot) return;

            const args = message.content.slice(bot.prefix.length).trim().split(/ +/);
            const commandName = args.shift().toLowerCase();

            const command = bot.commands.get(commandName);
            if (!command) return;

            try {
                command.execute(message, args, bot);
            } catch (error) {
                Logger.error(`Error executing command ${commandName}: ${error.message}`);
                console.error(error);  // For easier debugging, keep this line
                message.reply('There was an error executing that command!');
            }
        });
    }
};