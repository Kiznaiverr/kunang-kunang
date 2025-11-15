import { useQueue } from 'discord-player';
import { Logger } from '../utils/logging.js';

function calculateTotalDuration(currentTrack, tracks) {
    try {
        let totalSeconds = 0;
        
        if (currentTrack && currentTrack.durationMS) {
            totalSeconds += Math.floor(currentTrack.durationMS / 1000);
        }
        
        tracks.forEach(track => {
            if (track.durationMS) {
                totalSeconds += Math.floor(track.durationMS / 1000);
            }
        });
        
        if (totalSeconds === 0) {
            // If no duration available, estimate based on average 3.5 minutes per song
            const totalTracks = tracks.length + 1;
            const estimatedMinutes = Math.floor(totalTracks * 3.5);
            return `~${estimatedMinutes}m`;
        }
        
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else {
            return `${minutes}m`;
        }
    } catch (error) {
        return 'Unknown';
    }
}

export default {
    name: 'queue',
    description: 'Show the current queue',
    execute: async (message, args, bot) => {
        Logger.command('queue', message.author.username);
        Logger.debug(`Queue command initiated by ${message.author.username} in guild ${message.guild.name}`, 'QueueCommand');
        
        const queue = useQueue(message.guild.id);

        if (!queue || queue.isEmpty()) {
            Logger.debug('Queue is empty', 'QueueCommand');
            const embed = {
                color: 0xff0000,
                description: '**The queue is empty!**',
                timestamp: new Date()
            };
            return message.reply({ embeds: [embed] });
        }

        const currentTrack = queue.currentTrack;
        const tracks = queue.tracks.toArray();
        
        Logger.debug(`Queue has ${tracks.length + 1} total tracks (1 playing + ${tracks.length} queued)`, 'QueueCommand');

        const embed = {
            color: 0x2f3136,
            author: {
                name: `Queue for ${message.guild.name}`
            },
            fields: [],
            timestamp: new Date(),
            footer: {
                text: `${tracks.length + 1} songs • Total duration: ${calculateTotalDuration(currentTrack, tracks)}`
            }
        };

        embed.fields.push({
            name: 'Currently Playing',
            value: `[**${currentTrack.title}**](${currentTrack.url || 'https://example.com'})\n\`${currentTrack.author || 'Unknown'}\` • \`${currentTrack.duration || 'Unknown'}\``,
            inline: false
        });

        if (tracks.length > 0) {
            let queueList = '';
            tracks.slice(0, 10).forEach((track, index) => {
                queueList += `**${index + 1}.** [${track.title}](${track.url || 'https://example.com'})\n\`${track.author || 'Unknown'}\` • \`${track.duration || 'Unknown'}\`\n\n`;
            });

            if (tracks.length > 10) {
                queueList += `*... and ${tracks.length - 10} more songs*`;
            }

            embed.fields.push({
                name: 'Up Next',
                value: queueList,
                inline: false
            });
        }

        // Remove thumbnail from queue
        // if (currentTrack.thumbnail) {
        //     embed.thumbnail = {
        //         url: currentTrack.thumbnail
        //     };
        // }

        return message.reply({ embeds: [embed] });
    }
};