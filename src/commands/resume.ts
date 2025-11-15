import { useQueue } from 'discord-player';
import { Message, EmbedBuilder } from 'discord.js';
import { Logger } from '../utils/logging.js';
import { Command } from '../types/command.js';

const resumeCommand: Command = {
    name: 'resume',
    description: 'Resume the paused track',
    execute: async (message: Message, args: string[], bot: any) => {
        Logger.command('resume', message.author.username);
        if (!message.member!.voice.channel) {
            Logger.debug(`Resume command: User ${message.author.username} not in voice channel`);
            const embed = new EmbedBuilder()
                .setColor(0xff0000)
                .setTitle('Error')
                .setDescription('You need to be in a voice channel!')
                .setTimestamp()
                .setFooter({ text: 'Music Player' });
            return message.reply({ embeds: [embed] });
        }

        const queue = useQueue(message.guild!.id);

        if (!queue || !queue.currentTrack) {
            Logger.debug(`Resume command: No active queue or current track in guild ${message.guild!.name}`);
            const embed = new EmbedBuilder()
                .setColor(0xff0000)
                .setTitle('Error')
                .setDescription('No music is in the queue!')
                .setTimestamp()
                .setFooter({ text: 'Music Player' });
            return message.reply({ embeds: [embed] });
        }

        if (!queue.node.isPaused()) {
            Logger.debug(`Resume command: Queue is not paused in guild ${message.guild!.name}`);
            const embed = new EmbedBuilder()
                .setColor(0xff0000)
                .setTitle('Not Paused')
                .setDescription('The music is not paused!')
                .setTimestamp()
                .setFooter({ text: 'Music Player' });
            return message.reply({ embeds: [embed] });
        }

        try {
            queue.node.resume();
            Logger.debug(`Resume command: Successfully resumed track "${queue.currentTrack.title}" in guild ${message.guild!.name}`);
            const track = queue.currentTrack;
            const embed = new EmbedBuilder()
                .setColor(0x00ff00)
                .setTitle('Music Resumed')
                .setDescription(`**${track.title}**\nBy: ${track.author}`)
                .addFields({
                    name: 'Resumed by',
                    value: message.author.toString(),
                    inline: true
                })
                .setTimestamp()
                .setFooter({ text: 'Music Player' });
            return message.reply({ embeds: [embed] });
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            Logger.error(`Resume command error: ${errorMsg}`);
            console.error('Resume command error:', error);
            const embed = new EmbedBuilder()
                .setColor(0xff0000)
                .setTitle('Error')
                .setDescription('Error occurred while resuming the music!')
                .setTimestamp()
                .setFooter({ text: 'Music Player' });
            return message.reply({ embeds: [embed] });
        }
    }
};

export default resumeCommand;