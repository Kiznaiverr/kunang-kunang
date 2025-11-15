import { useQueue } from 'discord-player';
import { Logger } from '../utils/logging.js';

export default {
    name: 'skip',
    description: 'Skip the current song',
    execute: async (message, args, bot) => {
        Logger.command('skip', message.author.username);
        Logger.debug(`Skip command initiated by ${message.author.username} in guild ${message.guild.name}`, 'SkipCommand');
        
        if (!message.member.voice.channel) {
            Logger.debug('User not in voice channel', 'SkipCommand');
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
            Logger.debug('No active queue or not playing', 'SkipCommand');
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
            Logger.debug('User not in same voice channel as bot', 'SkipCommand');
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
                Logger.debug('No current track to skip', 'SkipCommand');
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
            Logger.debug(`Skipped track: ${currentTrack.title}`, 'SkipCommand');
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
            Logger.debug(`Skip command failed: ${error.message}`, 'SkipCommand');
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