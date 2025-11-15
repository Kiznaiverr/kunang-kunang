import { useQueue } from 'discord-player';
import { Message, EmbedBuilder } from 'discord.js';
import { Logger } from '../utils/logging.js';
import { Command } from '../types/command.js';

const volumeCommand: Command = {
    name: 'volume',
    description: 'Set or check the volume',
    execute: async (message: Message, args: string[], bot: any) => {
        Logger.command(`volume ${args.join(' ')}`, message.author.username);
        Logger.debug(`Volume command initiated by ${message.author.username} with args: [${args.join(', ')}]`, 'VolumeCommand');
        
        if (!message.member?.voice.channel) {
            Logger.debug('User not in voice channel', 'VolumeCommand');
            const embed = new EmbedBuilder()
                .setColor(0xff0000)
                .setTitle('Error')
                .setDescription('You need to be in a voice channel!')
                .setTimestamp()
                .setFooter({ text: 'Music Player' });
            return message.reply({ embeds: [embed] });
        }

        if (!message.guild) {
            Logger.debug('Message not in guild', 'VolumeCommand');
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
            Logger.debug('No active queue or not playing', 'VolumeCommand');
            const embed = new EmbedBuilder()
                .setColor(0xff0000)
                .setTitle('Error')
                .setDescription('No music is currently playing!')
                .setTimestamp()
                .setFooter({ text: 'Music Player' });
            return message.reply({ embeds: [embed] });
        }

        if (!args.length) {
            Logger.debug(`Checking current volume: ${queue.node.volume}%`, 'VolumeCommand');
            const embed = new EmbedBuilder()
                .setColor(0x0099ff)
                .setTitle('Current Volume')
                .setDescription(`Volume is currently set to **${queue.node.volume}%**`)
                .setTimestamp()
                .setFooter({ text: 'Music Player' });
            return message.reply({ embeds: [embed] });
        }

        const volume = parseInt(args[0]);

        if (isNaN(volume) || volume < 0 || volume > 100) {
            Logger.debug(`Invalid volume value: ${args[0]}`, 'VolumeCommand');
            const embed = new EmbedBuilder()
                .setColor(0xff0000)
                .setTitle('Invalid Volume')
                .setDescription('Please provide a volume between 0 and 100!')
                .setTimestamp()
                .setFooter({ text: 'Music Player' });
            return message.reply({ embeds: [embed] });
        }

        try {
            queue.node.setVolume(volume);
            Logger.debug(`Volume changed from ${queue.node.volume}% to ${volume}%`, 'VolumeCommand');
            const embed = new EmbedBuilder()
                .setColor(0x00ff00)
                .setTitle('Volume Changed')
                .setDescription(`Volume set to **${volume}%**`)
                .addFields({
                    name: 'Changed by',
                    value: message.author.toString(),
                    inline: true
                })
                .setTimestamp()
                .setFooter({ text: 'Music Player' });
            return message.reply({ embeds: [embed] });
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            Logger.debug(`Volume command failed: ${errorMsg}`, 'VolumeCommand');
            Logger.error(`Volume command error: ${errorMsg}`);
            console.error(error);
            const embed = new EmbedBuilder()
                .setColor(0xff0000)
                .setTitle('Error')
                .setDescription('Error occurred while changing the volume!')
                .setTimestamp()
                .setFooter({ text: 'Music Player' });
            return message.reply({ embeds: [embed] });
        }
    }
};

export default volumeCommand;