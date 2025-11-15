import { useQueue } from 'discord-player';
import { Message, EmbedBuilder } from 'discord.js';
import { Logger } from '../utils/logging.js';
import { Command } from '../types/command.js';

const nowplayingCommand: Command = {
    name: 'nowplaying',
    description: 'Show the currently playing track',
    execute: async (message: Message, args: string[], bot: any) => {
        Logger.command('nowplaying', message.author.username);
        if (!message.guild) {
            Logger.debug('Message not in guild', 'NowPlayingCommand');
            const embed = new EmbedBuilder()
                .setColor(0xff0000)
                .setDescription('**This command can only be used in a server!**')
                .setTimestamp();
            return message.reply({ embeds: [embed] });
        }

        const queue = useQueue(message.guild.id);

        if (!queue || !queue.currentTrack) {
            Logger.debug(`Nowplaying command: No active track playing in guild ${message.guild.name}`);
            const embed = new EmbedBuilder()
                .setColor(0xff0000)
                .setDescription('**Nothing is currently playing!**')
                .setTimestamp();
            return message.reply({ embeds: [embed] });
        }

        const track = queue.currentTrack;
        const progress = queue.node.createProgressBar();
        
        Logger.debug(`Nowplaying command: Displaying current track "${track.title}" in guild ${message.guild.name}`);
        const embed = new EmbedBuilder()
            .setColor(0x2f3136)
            .setAuthor({ name: 'Now Playing' })
            .setDescription(`[**${track.title}**](${track.url || 'https://example.com'})`)
            .addFields(
                {
                    name: 'Channel',
                    value: track.author || 'Unknown',
                    inline: true
                },
                {
                    name: 'Duration',
                    value: track.duration || 'Unknown',
                    inline: true
                },
                {
                    name: 'Volume',
                    value: `${queue.node.volume}%`,
                    inline: true
                },
                {
                    name: 'Requested by',
                    value: track.requestedBy?.toString() || 'Unknown',
                    inline: true
                },
                {
                    name: 'Queue',
                    value: `${queue.tracks.size} songs`,
                    inline: true
                },
                {
                    name: 'Loop',
                    value: queue.repeatMode ? 'Enabled' : 'Disabled',
                    inline: true
                }
            )
            .setTimestamp();

        if (progress) {
            embed.addFields({
                name: 'Progress',
                value: progress,
                inline: false
            });
        }

        return message.reply({ embeds: [embed] });
    }
};

export default nowplayingCommand;