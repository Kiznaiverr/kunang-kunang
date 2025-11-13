const { useQueue } = require('discord-player');
const { Logger } = require('../utils/logging');

module.exports = {
    name: 'stop',
    description: 'Stop the music and clear the queue',
    execute: async (message, args, bot) => {
        Logger.command('stop', message.author.username);
        if (!message.member.voice.channel) {
            Logger.debug(`Stop command: User ${message.author.username} not in voice channel`);
            const embed = {
                color: 0xff0000,
                title: 'Error',
                description: 'You need to be in a voice channel to stop the music!',
                timestamp: new Date(),
                footer: {
                    text: 'Music Player'
                }
            };
            return message.reply({ embeds: [embed] });
        }

        const queue = useQueue(message.guild.id);

        if (!queue || !queue.node.isPlaying()) {
            Logger.debug(`Stop command: No active music playing in guild ${message.guild.name}`);
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
            Logger.debug(`Stop command: User ${message.author.username} not in same voice channel as bot in guild ${message.guild.name}`);
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
            queue.node.stop();
            queue.clear();
            Logger.debug(`Stop command: Successfully stopped music and cleared queue in guild ${message.guild.name}`);
            const embed = {
                color: 0x00ff00,
                title: 'Music Stopped',
                description: 'Music stopped and queue cleared!',
                timestamp: new Date(),
                footer: {
                    text: 'Music Player'
                }
            };
            return message.reply({ embeds: [embed] });
        } catch (error) {
            Logger.error(`Stop command error: ${error.message}`);
            Logger.debug(`Stop command: Error occurred while stopping music in guild ${message.guild.name} - ${error.message}`);
            console.error(error);
            const embed = {
                color: 0xff0000,
                title: 'Error',
                description: 'Error occurred while stopping the music!',
                timestamp: new Date(),
                footer: {
                    text: 'Music Player'
                }
            };
            return message.reply({ embeds: [embed] });
        }
    }
};