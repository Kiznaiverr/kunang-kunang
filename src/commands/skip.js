const { useQueue } = require('discord-player');
const { Logger } = require('../utils/logging');

module.exports = {
    name: 'skip',
    description: 'Skip the current song',
    execute: async (message, args, bot) => {
        if (!message.member.voice.channel) {
            const embed = {
                color: 0xff0000,
                title: 'Error',
                description: 'You need to be in a voice channel to skip the music!',
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

        if (message.guild.members.me.voice.channelId && message.member.voice.channel.id !== message.guild.members.me.voice.channelId) {
            const embed = {
                color: 0xff0000,
                title: 'Error',
                description: 'You need to be in the same voice channel as me!',
                timestamp: new Date(),
                footer: {
                    text: 'Music Player'
                }
            };
            return message.reply({ embeds: [embed] });
        }

        try {
            const currentTrack = queue.currentTrack;
            
            if (!currentTrack) {
                const embed = {
                    color: 0xff0000,
                    title: 'Error',
                    description: 'No track is currently playing!',
                    timestamp: new Date(),
                    footer: {
                        text: 'Music Player'
                    }
                };
                return message.reply({ embeds: [embed] });
            }

            queue.node.skip();
            const embed = {
                color: 0x2f3136,
                author: {
                    name: 'Skipped'
                },
                description: `[**${currentTrack.title}**](${currentTrack.url || 'https://example.com'})`,
                // Remove thumbnail
                // thumbnail: {
                //     url: currentTrack.thumbnail || null
                // },
                timestamp: new Date(),
                footer: {
                    text: `Skipped by ${message.author.username}`
                }
            };
            return message.reply({ embeds: [embed] });
        } catch (error) {
            Logger.error(`Skip command error: ${error.message}`);
            console.error(error);
            const embed = {
                color: 0xff0000,
                title: 'Error',
                description: 'Error occurred while skipping the track!',
                timestamp: new Date(),
                footer: {
                    text: 'Music Player'
                }
            };
            return message.reply({ embeds: [embed] });
        }
    }
};