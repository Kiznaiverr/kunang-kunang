const { useQueue } = require('discord-player');
const { Logger } = require('../utils/logging');

module.exports = {
    name: 'pause',
    description: 'Pause the current track',
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

        if (!queue || !queue.node.isPlaying()) {
            const embed = {
                color: 0xff0000,
                title: 'Error',
                description: 'No music is currently playing!',
                timestamp: new Date(),
                footer: {
                    text: 'Music Player'
                }
            };
            return message.reply({ embeds: [embed] });
        }

        if (queue.node.isPaused()) {
            const embed = {
                color: 0xff0000,
                title: 'Already Paused',
                description: 'The music is already paused! Use `resume` to continue.',
                timestamp: new Date(),
                footer: {
                    text: 'Music Player'
                }
            };
            return message.reply({ embeds: [embed] });
        }

        try {
            queue.node.pause();
            const track = queue.currentTrack;
            const embed = {
                color: 0x2f3136,
                author: {
                    name: 'Paused'
                },
                description: `[**${track.title}**](${track.url || 'https://example.com'})`,
                // Remove thumbnail
                // thumbnail: {
                //     url: track.thumbnail || null
                // },
                timestamp: new Date(),
                footer: {
                    text: `Paused by ${message.author.username}`
                }
            };
            return message.reply({ embeds: [embed] });
        } catch (error) {
            Logger.error(`Pause command error: ${error.message}`);
            console.error(error);
            const embed = {
                color: 0xff0000,
                title: 'Error',
                description: 'Error occurred while pausing the music!',
                timestamp: new Date(),
                footer: {
                    text: 'Music Player'
                }
            };
            return message.reply({ embeds: [embed] });
        }
    }
};