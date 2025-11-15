import { useQueue } from 'discord-player';
import { Message, EmbedBuilder } from 'discord.js';
import { Logger } from '../utils/logging.js';
import { Command } from '../types/command.js';

const stopCommand: Command = {
    name: 'stop',
    description: 'Stop the music and clear the queue',
    execute: async (message: Message, args: string[], bot: any) => {
        Logger.command('stop', message.author.username);
        if (!message.member?.voice.channel) {
            Logger.debug(`Stop command: User ${message.author.username} not in voice channel`);
            const embed = new EmbedBuilder()
                .setColor(0xff0000)
                .setTitle('Error')
                .setDescription('You need to be in a voice channel to stop the music!')
                .setTimestamp()
                .setFooter({ text: 'Music Player' });
            return message.reply({ embeds: [embed] });
        }

        if (!message.guild) {
            Logger.debug('Message not in guild', 'StopCommand');
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
            Logger.debug(`Stop command: No active music playing in guild ${message.guild.name}`);
            const embed = new EmbedBuilder()
                .setColor(0xff0000)
                .setTitle('Error')
                .setDescription('No music is currently playing!')
                .setTimestamp()
                .setFooter({ text: 'Music Player' });
            return message.reply({ embeds: [embed] });
        }

        if (message.guild.members.me?.voice.channelId && message.member?.voice.channel.id !== message.guild.members.me.voice.channelId) {
            Logger.debug(`Stop command: User ${message.author.username} not in same voice channel as bot in guild ${message.guild.name}`);
            const embed = new EmbedBuilder()
                .setColor(0xff0000)
                .setTitle('Error')
                .setDescription('You need to be in the same voice channel as me!')
                .setTimestamp()
                .setFooter({ text: 'Music Player' });
            return message.reply({ embeds: [embed] });
        }

        try {
            queue.node.stop();
            queue.clear();
            Logger.debug(`Stop command: Successfully stopped music and cleared queue in guild ${message.guild.name}`);
            const embed = new EmbedBuilder()
                .setColor(0x00ff00)
                .setTitle('Music Stopped')
                .setDescription('Music stopped and queue cleared!')
                .setTimestamp()
                .setFooter({ text: 'Music Player' });
            return message.reply({ embeds: [embed] });
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            Logger.error(`Stop command error: ${errorMsg}`);
            Logger.debug(`Stop command: Error occurred while stopping music in guild ${message.guild.name} - ${errorMsg}`);
            console.error(error);
            const embed = new EmbedBuilder()
                .setColor(0xff0000)
                .setTitle('Error')
                .setDescription('Error occurred while stopping the music!')
                .setTimestamp()
                .setFooter({ text: 'Music Player' });
            return message.reply({ embeds: [embed] });
        }
    }
};

export default stopCommand;