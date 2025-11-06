const chalk = require('chalk');

module.exports = {
    registerPlayerEvents(client, bot) {
        // Track start event - when a song starts playing
        bot.player.events.on('trackStart', (queue, track) => {
            if (queue.metadata) {
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
        });

        // Track add event - when a song is added to queue
        bot.player.events.on('trackAdd', (queue, track) => {
            // Only show "Added to Queue" if there are already tracks playing/in queue
            // This prevents duplicate messages when using the play command
            if (queue.metadata && queue.tracks.size > 0) {
                const embed = {
                    color: 0x00ff00,
                    author: {
                        name: 'Added to queue'
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
                            name: 'Position in queue',
                            value: `${queue.tracks.size}`,
                            inline: true
                        }
                    ],
                    timestamp: new Date(),
                    footer: {
                        text: `Requested by ${track.requestedBy?.username || 'Unknown'}`
                    }
                };
                queue.metadata.reply({ embeds: [embed] });
            }
        });

        // Queue end event - when all songs finish
        bot.player.events.on('queueEnd', (queue) => {
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
        });

        // Channel empty event - when voice channel becomes empty
        bot.player.events.on('channelEmpty', (queue) => {
            console.log(chalk.yellow('Voice channel is empty, starting idle timer'));
        });

        // Additional logging events
        bot.player.events.on('audioTrackAdd', (queue, track) => {
            console.log(chalk.blue(`Track added: ${track.title}`));
        });

        bot.player.events.on('emptyChannel', (queue) => {
            console.log(chalk.yellow('Voice channel is empty'));
        });

        bot.player.events.on('emptyQueue', (queue) => {
            console.log(chalk.yellow('Queue is empty'));
        });
    }
};