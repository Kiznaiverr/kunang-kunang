const chalk = require('chalk');

module.exports = {
    registerErrorEvents(client, bot) {
        // General player error handling
        bot.player.events.on('error', (queue, error) => {
            console.error(chalk.red(`General player error: ${error.message}`));
            if (queue.metadata) {
                queue.metadata.reply('Something went wrong with Kunang-Kunang!');
            }
        });

        // Player-specific error handling
        bot.player.events.on('playerError', (queue, error) => {
            console.error(chalk.red(`Player error: ${error.message}`));
            if (queue.metadata) {
                queue.metadata.reply('Error occurred while playing the track!');
            }
        });

        // Bot disconnect event
        bot.player.events.on('botDisconnect', (queue) => {
            if (queue.metadata) {
                const embed = {
                    color: 0xff0000,
                    title: 'Disconnected',
                    description: 'I was disconnected from the voice channel, clearing queue!',
                    timestamp: new Date(),
                    footer: {
                        text: 'Kunang-Kunang'
                    }
                };
                queue.metadata.reply({ embeds: [embed] });
            }
        });

        // Disconnect event logging
        bot.player.events.on('disconnect', (queue) => {
            console.log(chalk.yellow('Bot disconnected from voice channel'));
        });
    }
};