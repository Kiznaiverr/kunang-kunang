import { Logger } from '../../utils/logging.js';

export default {
    registerErrorEvents(client, bot) {
        Logger.debug('Registering error events', 'ErrorEvents');
        
        bot.player.events.on('error', (queue, error) => {
            Logger.debug(`General player error in guild ${queue?.guild?.name}: ${error.message}`, 'ErrorEvents');
            Logger.error(`General player error: ${error.message}`);
            if (queue.metadata) {
                queue.metadata.reply('Something went wrong with Kunang-Kunang!');
            }
        });

        bot.player.events.on('playerError', (queue, error) => {
            Logger.debug(`Player error in guild ${queue?.guild?.name}: ${error.message}`, 'ErrorEvents');
            Logger.error(`Player error: ${error.message}`);
            if (queue.metadata) {
                queue.metadata.reply('Error occurred while playing the track!');
            }
        });

        // bot.player.events.on('botDisconnect', (queue) => {
        //     if (queue.metadata) {
        //         const embed = {
        //             color: 0xff0000,
        //             title: 'Disconnected',
        //             description: 'I was disconnected from the voice channel, clearing queue!',
        //             timestamp: new Date(),
        //             footer: {
        //                 text: 'Kunang-Kunang'
        //             }
        //         };
        //         queue.metadata.reply({ embeds: [embed] });
        //     }
        // });

        // Disconnect event logging
        bot.player.events.on('disconnect', (queue) => {
            Logger.debug(`Bot disconnected from voice channel in guild ${queue?.guild?.name}`, 'ErrorEvents');
            Logger.info('Bot disconnected from voice channel');
        });
    }
};