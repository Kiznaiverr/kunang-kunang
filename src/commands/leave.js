const { useQueue } = require('discord-player');
const { Logger } = require('../utils/logging');

module.exports = {
    name: 'leave',
    description: 'Leave the voice channel',
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

        if (!message.guild.members.me.voice.channel) {
            const embed = {
                color: 0xff0000,
                title: 'Error',
                description: 'I am not in a voice channel!',
                timestamp: new Date(),
                footer: {
                    text: 'Music Player'
                }
            };
            return message.reply({ embeds: [embed] });
        }

        if (message.member.voice.channel.id !== message.guild.members.me.voice.channelId) {
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
            const queue = useQueue(message.guild.id);
            
            if (queue) {
                queue.delete();
            }

            await message.guild.members.me.voice.disconnect();
            const embed = {
                color: 0x00ff00,
                title: 'Left Voice Channel',
                description: 'Left the voice channel and cleared the queue!',
                fields: [
                    {
                        name: 'Disconnected by',
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
            Logger.error(`Leave command error: ${error.message}`);
            console.error(error);
            const embed = {
                color: 0xff0000,
                title: 'Error',
                description: 'Error occurred while leaving the voice channel!',
                timestamp: new Date(),
                footer: {
                    text: 'Music Player'
                }
            };
            return message.reply({ embeds: [embed] });
        }
    }
};