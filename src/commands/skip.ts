import { useQueue } from 'discord-player';
import { Message, EmbedBuilder } from 'discord.js';
import { Logger } from '../utils/logging.js';
import { Command } from '../types/command.js';

const skipCommand: Command = {
    name: 'skip',
    description: 'Skip the current song',
    execute: async (message: Message, args: string[], bot: any) => {
        Logger.command('skip', message.author.username);
        Logger.debug(`Skip command initiated by ${message.author.username} in guild ${message.guild?.name}`, 'SkipCommand');
        
        if (!message.member?.voice.channel) {
            Logger.debug('User not in voice channel', 'SkipCommand');
            const embed = new EmbedBuilder()
                .setColor(0xff0000)
                .setTitle('Error')
                .setDescription('You need to be in a voice channel to skip the music!')
                .setTimestamp()
                .setFooter({ text: 'Music Player' });
            return message.reply({ embeds: [embed] });
        }

        if (!message.guild) {
            Logger.debug('Message not in guild', 'SkipCommand');
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
            Logger.debug('No active queue or not playing', 'SkipCommand');
            const embed = new EmbedBuilder()
                .setColor(0xff0000)
                .setTitle('Error')
                .setDescription('No music is currently playing!')
                .setTimestamp()
                .setFooter({ text: 'Music Player' });
            return message.reply({ embeds: [embed] });
        }

        if (message.guild.members.me?.voice.channelId && message.member?.voice.channel.id !== message.guild.members.me.voice.channelId) {
            Logger.debug('User not in same voice channel as bot', 'SkipCommand');
            const embed = new EmbedBuilder()
                .setColor(0xff0000)
                .setTitle('Error')
                .setDescription('You need to be in the same voice channel as me!')
                .setTimestamp()
                .setFooter({ text: 'Music Player' });
            return message.reply({ embeds: [embed] });
        }

        try {
            const currentTrack = queue.currentTrack;
            
            if (!currentTrack) {
                Logger.debug('No current track to skip', 'SkipCommand');
                const embed = new EmbedBuilder()
                    .setColor(0xff0000)
                    .setTitle('Error')
                    .setDescription('No track is currently playing!')
                    .setTimestamp()
                    .setFooter({ text: 'Music Player' });
                return message.reply({ embeds: [embed] });
            }

            queue.node.skip();
            Logger.debug(`Skipped track: ${currentTrack.title}`, 'SkipCommand');
            const embed = new EmbedBuilder()
                .setColor(0x2f3136)
                .setAuthor({ name: 'Skipped' })
                .setDescription(`[**${currentTrack.title}**](${currentTrack.url || 'https://example.com'})`)
                .setTimestamp()
                .setFooter({ text: `Skipped by ${message.author.username}` });
            return message.reply({ embeds: [embed] });
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            Logger.debug(`Skip command failed: ${errorMsg}`, 'SkipCommand');
            Logger.error(`Skip command error: ${errorMsg}`);
            console.error(error);
            const embed = new EmbedBuilder()
                .setColor(0xff0000)
                .setTitle('Error')
                .setDescription('Error occurred while skipping the track!')
                .setTimestamp()
                .setFooter({ text: 'Music Player' });
            return message.reply({ embeds: [embed] });
        }
    }
};

export default skipCommand;