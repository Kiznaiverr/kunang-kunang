import { useQueue } from 'discord-player';
import { Message, EmbedBuilder } from 'discord.js';
import { Logger } from '../utils/logging.js';
import { Command } from '../types/command.js';

const pauseCommand: Command = {
    name: 'pause',
    description: 'Pause the current track',
    execute: async (message: Message, args: string[], bot: any) => {
        Logger.command('pause', message.author.username);
        Logger.debug(`Pause command initiated by ${message.author.username} in guild ${message.guild?.name}`, 'PauseCommand');
        
        if (!message.member?.voice.channel) {
            Logger.debug('User not in voice channel', 'PauseCommand');
            const embed = new EmbedBuilder()
                .setColor(0xff0000)
                .setTitle('Error')
                .setDescription('You need to be in a voice channel!')
                .setTimestamp()
                .setFooter({ text: 'Music Player' });
            return message.reply({ embeds: [embed] });
        }

        if (!message.guild) {
            Logger.debug('Message not in guild', 'PauseCommand');
            const embed = new EmbedBuilder()
                .setColor(0xff0000)
                .setTitle('Error')
                .setDescription('This command can only be used in a server!')
                .setTimestamp()
                .setFooter({ text: 'Music Player' });
            return message.reply({ embeds: [embed] });
        }

        const queue = useQueue(message.guild.id);

        if (!queue || !queue.node.isPlaying()) {
            Logger.debug('No active queue or not playing', 'PauseCommand');
            const embed = new EmbedBuilder()
                .setColor(0xff0000)
                .setTitle('Error')
                .setDescription('No music is currently playing!')
                .setTimestamp()
                .setFooter({ text: 'Music Player' });
            return message.reply({ embeds: [embed] });
        }

        if (queue.node.isPaused()) {
            Logger.debug('Music is already paused', 'PauseCommand');
            const embed = new EmbedBuilder()
                .setColor(0xff0000)
                .setTitle('Already Paused')
                .setDescription('The music is already paused! Use `resume` to continue.')
                .setTimestamp()
                .setFooter({ text: 'Music Player' });
            return message.reply({ embeds: [embed] });
        }

        try {
            queue.node.pause();
            const track = queue.currentTrack;
            if (!track) {
                Logger.debug('No current track after pause', 'PauseCommand');
                const embed = new EmbedBuilder()
                    .setColor(0xff0000)
                    .setTitle('Error')
                    .setDescription('No track to pause!')
                    .setTimestamp()
                    .setFooter({ text: 'Music Player' });
                return message.reply({ embeds: [embed] });
            }
            Logger.debug(`Paused track: ${track.title}`, 'PauseCommand');
            const embed = new EmbedBuilder()
                .setColor(0x2f3136)
                .setAuthor({ name: 'Paused' })
                .setDescription(`[**${track.title}**](${track.url || 'https://example.com'})`)
                .setTimestamp()
                .setFooter({ text: `Paused by ${message.author.username}` });
            return message.reply({ embeds: [embed] });
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            Logger.debug(`Pause command failed: ${errorMsg}`, 'PauseCommand');
            Logger.error(`Pause command error: ${errorMsg}`);
            console.error(error);
            const embed = new EmbedBuilder()
                .setColor(0xff0000)
                .setTitle('Error')
                .setDescription('Error occurred while pausing the music!')
                .setTimestamp()
                .setFooter({ text: 'Music Player' });
            return message.reply({ embeds: [embed] });
        }
    }
};

export default pauseCommand;