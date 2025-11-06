const chalk = require('chalk');

module.exports = {
    registerClientEvents(client, bot) {
        // Bot ready event
        client.once('clientReady', () => {
            console.log(chalk.green(`Logged in as ${client.user.tag}`));
            console.log(chalk.green(`Bot is ready! Serving ${client.guilds.cache.size} server`));
        });

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
                console.error(chalk.red(`Error executing command ${commandName}:`), error);
                message.reply('There was an error executing that command!');
            }
        });
    }
};