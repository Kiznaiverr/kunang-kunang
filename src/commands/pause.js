import { useQueue } from 'discord-player';
import { Logger } from '../utils/logging.js';

export default {
    name: 'pause',
    description: 'Pause the current track',
    execute: async (message, args, bot) => {
        Logger.command('pause', message.author.username);
        Logger.debug(`Pause command initiated by ${message.author.username} in guild ${message.guild.name}`, 'PauseCommand');
        
        if (!message.member.voice.channel) {
            Logger.debug('User not in voice channel', 'PauseCommand');
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
            Logger.debug('No active queue or not playing', 'PauseCommand');
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
            Logger.debug('Music is already paused', 'PauseCommand');
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
            Logger.debug(`Paused track: ${track.title}`, 'PauseCommand');
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
            Logger.debug(`Pause command failed: ${error.message}`, 'PauseCommand');
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