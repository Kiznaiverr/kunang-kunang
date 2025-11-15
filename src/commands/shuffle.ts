import { useQueue } from 'discord-player';
import { Message, EmbedBuilder } from 'discord.js';
import { Logger } from '../utils/logging.js';
import { Command } from '../types/command.js';

const shuffleCommand: Command = {
    name: 'shuffle',
    description: 'Shuffle the queue',
    execute: async (message: Message, args: string[], bot: any) => {
        Logger.command('shuffle', message.author.username);
        Logger.debug(`Shuffle command initiated by ${message.author.username} in guild ${message.guild!.name}`, 'ShuffleCommand');
        
        if (!message.member!.voice.channel) {
            Logger.debug('User not in voice channel', 'ShuffleCommand');
            const embed = new EmbedBuilder()
                .setColor(0xff0000)
                .setTitle('Error')
                .setDescription('You need to be in a voice channel!')
                .setTimestamp()
                .setFooter({ text: 'Music Player' });
            return message.reply({ embeds: [embed] });
        }

        const queue = useQueue(message.guild!.id);

        if (!queue || queue.isEmpty()) {
            const embed = new EmbedBuilder()
                .setColor(0xff0000)
                .setTitle('Error')
                .setDescription('The queue is empty!')
                .setTimestamp()
                .setFooter({ text: 'Music Player' });
            return message.reply({ embeds: [embed] });
        }

        if (queue.tracks.size < 2) {
            Logger.debug(`Shuffle command: Not enough tracks in queue (${queue.tracks.size}) - minimum 2 required`);
            const embed = new EmbedBuilder()
                .setColor(0xff0000)
                .setTitle('Error')
                .setDescription('Not enough tracks in queue to shuffle! Need at least 2 tracks.')
                .setTimestamp()
                .setFooter({ text: 'Music Player' });
            return message.reply({ embeds: [embed] });
        }

        try {
            queue.tracks.shuffle();
            Logger.debug(`Shuffle command: Successfully shuffled ${queue.tracks.size} tracks in queue`);
            const embed = new EmbedBuilder()
                .setColor(0x9932cc)
                .setTitle('Queue Shuffled')
                .setDescription(`Successfully shuffled **${queue.tracks.size}** tracks in the queue!`)
                .addFields(
                    {
                        name: 'Shuffled by',
                        value: message.author.toString(),
                        inline: true
                    },
                    {
                        name: 'Total Tracks',
                        value: `${queue.tracks.size}`,
                        inline: true
                    }
                )
                .setTimestamp()
                .setFooter({ text: 'Music Player' });
            return message.reply({ embeds: [embed] });
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            Logger.error(`Shuffle command error: ${errorMsg}`);
            console.error(error);
            const embed = new EmbedBuilder()
                .setColor(0xff0000)
                .setTitle('Error')
                .setDescription('Error occurred while shuffling the queue!')
                .setTimestamp()
                .setFooter({ text: 'Music Player' });
            return message.reply({ embeds: [embed] });
        }
    }
};

export default shuffleCommand;