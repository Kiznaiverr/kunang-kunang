import { useQueue } from 'discord-player';
import { Logger } from '../utils/logging.js';

export default {
    name: 'volume',
    aliases: ['vol'],
    description: 'Set or check the volume',
    execute: async (message, args, bot) => {
        Logger.command(`volume ${args.join(' ')}`, message.author.username);
        Logger.debug(`Volume command initiated by ${message.author.username} with args: [${args.join(', ')}]`, 'VolumeCommand');
        
        if (!message.member.voice.channel) {
            Logger.debug('User not in voice channel', 'VolumeCommand');
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
            Logger.debug('No active queue or not playing', 'VolumeCommand');
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

        if (!args.length) {
            Logger.debug(`Checking current volume: ${queue.node.volume}%`, 'VolumeCommand');
            const embed = {
                color: 0x0099ff,
                title: 'Current Volume',
                description: `Volume is currently set to **${queue.node.volume}%**`,
                timestamp: new Date(),
                footer: {
                    text: 'Music Player'
                }
            };
            return message.reply({ embeds: [embed] });
        }

        const volume = parseInt(args[0]);

        if (isNaN(volume) || volume < 0 || volume > 100) {
            Logger.debug(`Invalid volume value: ${args[0]}`, 'VolumeCommand');
            const embed = {
                color: 0xff0000,
                title: 'Invalid Volume',
                description: 'Please provide a volume between 0 and 100!',
                timestamp: new Date(),
                footer: {
                    text: 'Music Player'
                }
            };
            return message.reply({ embeds: [embed] });
        }

        try {
            queue.node.setVolume(volume);
            Logger.debug(`Volume changed from ${queue.node.volume}% to ${volume}%`, 'VolumeCommand');
            const embed = {
                color: 0x00ff00,
                title: 'Volume Changed',
                description: `Volume set to **${volume}%**`,
                fields: [
                    {
                        name: 'Changed by',
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
            Logger.debug(`Volume command failed: ${error.message}`, 'VolumeCommand');
            Logger.error(`Volume command error: ${error.message}`);
            console.error(error);
            const embed = {
                color: 0xff0000,
                title: 'Error',
                description: 'Error occurred while changing the volume!',
                timestamp: new Date(),
                footer: {
                    text: 'Music Player'
                }
            };
            return message.reply({ embeds: [embed] });
        }
    }
};