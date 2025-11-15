import { useQueue } from 'discord-player';
import { Message, EmbedBuilder } from 'discord.js';
import { Logger } from '../utils/logging.js';
import { Command } from '../types/command.js';

function calculateTotalDuration(currentTrack: any, tracks: any[]) {
    try {
        let totalSeconds = 0;
        
        if (currentTrack && currentTrack.durationMS) {
            totalSeconds += Math.floor(currentTrack.durationMS / 1000);
        }
        
        tracks.forEach((track: any) => {
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

const queueCommand: Command = {
    name: 'queue',
    description: 'Show the current queue',
    execute: async (message: Message, args: string[], bot: any) => {
        Logger.command('queue', message.author.username);
        Logger.debug(`Queue command initiated by ${message.author.username} in guild ${message.guild?.name}`, 'QueueCommand');
        
        if (!message.guild) {
            Logger.debug('Message not in guild', 'QueueCommand');
            const embed = new EmbedBuilder()
                .setColor(0xff0000)
                .setDescription('**This command can only be used in a server!**')
                .setTimestamp();
            return message.reply({ embeds: [embed] });
        }

        const queue = useQueue(message.guild.id);

        if (!queue || queue.isEmpty()) {
            Logger.debug('Queue is empty', 'QueueCommand');
            const embed = new EmbedBuilder()
                .setColor(0xff0000)
                .setDescription('**The queue is empty!**')
                .setTimestamp();
            return message.reply({ embeds: [embed] });
        }

        const currentTrack = queue.currentTrack;
        if (!currentTrack) {
            Logger.debug('No current track', 'QueueCommand');
            const embed = new EmbedBuilder()
                .setColor(0xff0000)
                .setDescription('**No track is currently playing!**')
                .setTimestamp();
            return message.reply({ embeds: [embed] });
        }
        const tracks = queue.tracks.toArray();
        
        Logger.debug(`Queue has ${tracks.length + 1} total tracks (1 playing + ${tracks.length} queued)`, 'QueueCommand');

        const embed = new EmbedBuilder()
            .setColor(0x2f3136)
            .setAuthor({ name: `Queue for ${message.guild.name}` })
            .addFields({
                name: 'Currently Playing',
                value: `[**${currentTrack.title}**](${currentTrack.url || 'https://example.com'})\n\`${currentTrack.author || 'Unknown'}\` • \`${currentTrack.duration || 'Unknown'}\``,
                inline: false
            })
            .setTimestamp()
            .setFooter({ text: `${tracks.length + 1} songs • Total duration: ${calculateTotalDuration(currentTrack, tracks)}` });

        if (tracks.length > 0) {
            let queueList = '';
            tracks.slice(0, 10).forEach((track, index) => {
                queueList += `**${index + 1}.** [${track.title}](${track.url || 'https://example.com'})\n\`${track.author || 'Unknown'}\` • \`${track.duration || 'Unknown'}\`\n\n`;
            });

            if (tracks.length > 10) {
                queueList += `*... and ${tracks.length - 10} more songs*`;
            }

            embed.addFields({
                name: 'Up Next',
                value: queueList,
                inline: false
            });
        }

        return message.reply({ embeds: [embed] });
    }
};

export default queueCommand;