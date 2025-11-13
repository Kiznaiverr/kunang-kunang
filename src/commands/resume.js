const { useQueue } = require('discord-player');
const { Logger } = require('../utils/logging');

module.exports = {
    name: 'resume',
    description: 'Resume the paused track',
    execute: async (message, args, bot) => {
        Logger.command('resume', message.author.username);
        if (!message.member.voice.channel) {
            Logger.debug(`Resume command: User ${message.author.username} not in voice channel`);
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

        if (!queue || !queue.currentTrack) {
            Logger.debug(`Resume command: No active queue or current track in guild ${message.guild.name}`);
            const embed = {
                color: 0xff0000,
                title: 'Error',
                description: 'No music is in the queue!',
                timestamp: new Date(),
                footer: {
                    text: 'Music Player'
                }
            };
            return message.reply({ embeds: [embed] });
        }

        if (!queue.node.isPaused()) {
            Logger.debug(`Resume command: Queue is not paused in guild ${message.guild.name}`);
            const embed = {
                color: 0xff0000,
                title: 'Not Paused',
                description: 'The music is not paused!',
                timestamp: new Date(),
                footer: {
                    text: 'Music Player'
                }
            };
            return message.reply({ embeds: [embed] });
        }

        try {
            queue.node.resume();
            Logger.debug(`Resume command: Successfully resumed track "${queue.currentTrack.title}" in guild ${message.guild.name}`);
            const track = queue.currentTrack;
            const embed = {
                color: 0x00ff00,
                title: 'Music Resumed',
                description: `**${track.title}**\nBy: ${track.author}`,
                // Remove thumbnail
                // thumbnail: {
                //     url: track.thumbnail || 'https://via.placeholder.com/150x150?text=No+Image'
                // },
                fields: [
                    {
                        name: 'Resumed by',
                        value: message.author.toString(),
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
            Logger.error(`Resume command error: ${error.message}`);
            console.error('Resume command error:', error);
            const embed = {
                color: 0xff0000,
                title: 'Error',
                description: 'Error occurred while resuming the music!',
                timestamp: new Date(),
                footer: {
                    text: 'Music Player'
                }
            };
            return message.reply({ embeds: [embed] });
        }
    }
};