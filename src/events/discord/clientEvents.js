import { Logger } from '../../utils/logging.js';

export default {
    registerClientEvents(client, bot) {
        // Message command handling
        client.on('messageCreate', (message) => {
            // Skip logging for empty messages or messages from bots
            if (!message.content || message.content.trim() === '' || message.author.bot) {
                return;
            }
            
            Logger.debug(`Message received: ${message.content.substring(0, 100)}${message.content.length > 100 ? '...' : ''}`, 'MessageHandler');
            
            if (!message.content.startsWith(bot.prefix)) {
                Logger.debug('Message ignored (not a command)', 'MessageHandler');
                return;
            }

            const args = message.content.slice(bot.prefix.length).trim().split(/ +/);
            const commandName = args.shift().toLowerCase();

            Logger.debug(`Command parsed: ${commandName}, args: [${args.join(', ')}]`, 'MessageHandler');

            const command = bot.commands.get(commandName);
            if (!command) {
                Logger.debug(`Command '${commandName}' not found`, 'MessageHandler');
                return;
            }

            Logger.debug(`Executing command: ${commandName}`, 'MessageHandler');
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