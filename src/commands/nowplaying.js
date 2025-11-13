const { useQueue } = require('discord-player');
const { Logger } = require('../utils/logging');

module.exports = {
    name: 'nowplaying',
    aliases: ['np', 'current'],
    description: 'Show the currently playing track',
    execute: async (message, args, bot) => {
        Logger.command('nowplaying', message.author.username);
        const queue = useQueue(message.guild.id);

        if (!queue || !queue.currentTrack) {
            Logger.debug(`Nowplaying command: No active track playing in guild ${message.guild.name}`);
            const embed = {
                color: 0xff0000,
                description: '**Nothing is currently playing!**',
                timestamp: new Date()
            };
            return message.reply({ embeds: [embed] });
        }

        const track = queue.currentTrack;
        const progress = queue.node.createProgressBar();
        
        Logger.debug(`Nowplaying command: Displaying current track "${track.title}" in guild ${message.guild.name}`);
        const embed = {
            color: 0x2f3136,
            author: {
                name: 'Now Playing'
            },
            description: `[**${track.title}**](${track.url || 'https://example.com'})`,
            fields: [
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
            ],
            // Remove thumbnail from nowplaying
            // thumbnail: {
            //     url: track.thumbnail || null
            // },
            timestamp: new Date()
        };

        if (progress) {
            embed.fields.push({
                name: 'Progress',
                value: progress,
                inline: false
            });
        }

        return message.reply({ embeds: [embed] });
    }
};