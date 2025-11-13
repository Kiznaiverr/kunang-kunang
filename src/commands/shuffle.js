const { useQueue } = require('discord-player');
const { Logger } = require('../utils/logging');

module.exports = {
    name: 'shuffle',
    description: 'Shuffle the queue',
    execute: async (message, args, bot) => {
        if (!message.member.voice.channel) {
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