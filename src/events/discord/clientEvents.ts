import { Logger } from '../../utils/logging.js';
import { Client, Message } from 'discord.js';
import { MusicBot } from '../../types/bot.js';

export default {
    registerClientEvents(client: Client, bot: MusicBot) {
        // Message command handling
        client.on('messageCreate', (message: Message) => {
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
            const commandName = args.shift()!.toLowerCase();

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
                const errorMessage = error instanceof Error ? error.message : String(error);
                Logger.error(`Error executing command ${commandName}: ${errorMessage}`);
                message.reply('There was an error executing that command!');
            }
        });
    }
};