const { useQueue } = require('discord-player');
const { Logger } = require('../utils/logging');

module.exports = {
    name: 'shuffle',
    description: 'Shuffle the queue',
    execute: async (message, args, bot) => {
        Logger.command('shuffle', message.author.username);
        Logger.debug(`Shuffle command initiated by ${message.author.username} in guild ${message.guild.name}`, 'ShuffleCommand');
        
        if (!message.member.voice.channel) {
            Logger.debug('User not in voice channel', 'ShuffleCommand');
            const embed = {
                color: 0xff0000,
                title: 'Error',
                description: 'You need to be in a voice channel!',
                timestamp: new Date(),
                footer: {
                    text: 'Music Player'
                }
            };
            return message.reply({ embeds: [embed] });
        }

        const queue = useQueue(message.guild.id);

        if (!queue || queue.isEmpty()) {
            const embed = {
                color: 0xff0000,
                title: 'Error',
                description: 'The queue is empty!',
                timestamp: new Date(),
                footer: {
                    text: 'Music Player'
                }
            };
            return message.reply({ embeds: [embed] });
        }

        if (queue.tracks.size < 2) {
            Logger.debug(`Shuffle command: Not enough tracks in queue (${queue.tracks.size}) - minimum 2 required`);
            const embed = {
                color: 0xff0000,
                title: 'Error',
                description: 'Not enough tracks in queue to shuffle! Need at least 2 tracks.',
                timestamp: new Date(),
                footer: {
                    text: 'Music Player'
                }
            };
            return message.reply({ embeds: [embed] });
        }

        try {
            queue.tracks.shuffle();
            Logger.debug(`Shuffle command: Successfully shuffled ${queue.tracks.size} tracks in queue`);
            const embed = {
                color: 0x9932cc,
                title: 'Queue Shuffled',
                description: `Successfully shuffled **${queue.tracks.size}** tracks in the queue!`,
                fields: [
                    {
                        name: 'Shuffled by',
                        value: message.author.toString(),
                        inline: true
                    },
                    {
                        name: 'Total Tracks',
                        value: `${queue.tracks.size}`,
                        inline: true
                    }
                ],
                timestamp: new Date(),
                footer: {
                    text: 'Music Player'
                }
            };
            return message.reply({ embeds: [embed] });
        } catch (error) {
            Logger.error(`Shuffle command error: ${error.message}`);
            console.error(error);
            const embed = {
                color: 0xff0000,
                title: 'Error',
                description: 'Error occurred while shuffling the queue!',
                timestamp: new Date(),
                footer: {
                    text: 'Music Player'
                }
            };
            return message.reply({ embeds: [embed] });
        }
    }
};