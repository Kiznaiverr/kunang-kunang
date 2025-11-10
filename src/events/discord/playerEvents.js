const chalk = require('chalk');

module.exports = {
    registerPlayerEvents(client, bot) {
        // Track start event - when a song starts playing
        bot.player.events.on('playerStart', (queue, track) => {
            if (queue.metadata && !queue.metadata.author.id.startsWith('tiktok_')) {
                const embed = {
                    color: 0x2f3136,
                    author: {
                        name: 'Now Playing'
                    },
                    description: `[**${track.title}**](${track.url || 'https://example.com'})`,
                    fields: [
                        {
                            name: 'Channel',
                            value: track.author || 'Unknown',
                            inline: true
                        },
                        {
                            name: 'Duration',
                            value: track.duration || 'Unknown',
                            inline: true
                        },
                        {
                            name: 'Requested by',
                            value: track.requestedBy?.toString() || queue.metadata.author.toString(),
                            inline: true
                        }
                    ],
                    timestamp: new Date(),
                    footer: {
                        text: `Volume: ${queue.node.volume}% • Queue: ${queue.tracks.size} songs`
                    }
                };
                queue.metadata.reply({ embeds: [embed] });
            }

            // Update overlay
            if (bot.overlayServer) {
                console.log(chalk.blue('Updating overlay with track start'));
                bot.overlayServer.updateStatus(track, queue);
            }
        });

        bot.player.events.on('audioTrackAdd', (queue, track) => {
            if (bot.overlayServer) {
                const currentTrack = queue.currentTrack;
                bot.overlayServer.updateStatus(currentTrack, queue);
            }
        });

        // Additional logging events
        bot.player.events.on('audioTrackAdd', (queue, track) => {
            console.log(chalk.yellow(`Track added: ${track.title} from: ${track.source || 'unknown'}`));
        });

        bot.player.events.on('emptyChannel', (queue) => {
            console.log(chalk.yellow('Voice channel is empty'));
        });

        bot.player.events.on('queueFinish', (queue) => {
            if (queue.metadata) {
                const embed = {
                    color: 0xffff00,
                    title: 'Queue Finished',
                    description: 'Queue finished! No more songs to play.',
                    timestamp: new Date(),
                    footer: {
                        text: 'Kunang-Kunang'
                    }
                };
                queue.metadata.reply({ embeds: [embed] });
            }

            if (bot.overlayServer) {
                console.log(chalk.blue('Updating overlay with queue finish'));
                bot.overlayServer.updateStatus(null, queue);
            }

            console.log(chalk.yellow('Queue is empty'));
        });
    }
};