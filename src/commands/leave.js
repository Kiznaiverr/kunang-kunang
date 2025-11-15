import { useQueue } from 'discord-player';
import { Logger } from '../utils/logging.js';

export default {
    name: 'leave',
    description: 'Leave the voice channel',
    execute: async (message, args, bot) => {
        Logger.command('leave', message.author.username);
        Logger.debug(`Leave command initiated by ${message.author.username} in guild ${message.guild.name}`, 'LeaveCommand');
        
        if (!message.member.voice.channel) {
            Logger.debug('User not in voice channel', 'LeaveCommand');
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
            Logger.debug('Bot is not in any voice channel', 'LeaveCommand');
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
            Logger.debug('User not in same voice channel as bot', 'LeaveCommand');
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
                Logger.debug('Deleting queue', 'LeaveCommand');
                queue.delete();
            }

            Logger.debug('Disconnecting from voice channel', 'LeaveCommand');
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
            Logger.debug(`Leave command failed: ${error.message}`, 'LeaveCommand');
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