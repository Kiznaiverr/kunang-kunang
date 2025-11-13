const { useMainPlayer } = require('discord-player');
const config = require('../config');
const { Logger } = require('../utils/logging');

module.exports = {
    name: 'play',
    description: 'Play a song',
    execute: async (message, args, bot) => {
        const player = useMainPlayer();

        if (!message.member.voice.channel) {
            const embed = {
                color: 0xff0000,
                title: 'Error',
                description: 'You need to be in a voice channel to play music!',
                timestamp: new Date(),
                footer: {
                    text: 'Kunang-Kunang'
                }
            };
            return message.reply({ embeds: [embed] });
        }

        if (!args.length) {
            const embed = {
                color: 0xff0000,
                title: 'Error',
                description: 'Please provide a song name or URL!',
                timestamp: new Date(),
                footer: {
                    text: 'Kunang-Kunang'
                }
            };
            return message.reply({ embeds: [embed] });
        }

        const query = args.join(' ');

        try {
            // Don't specify searchEngine parameter - let extractors validate naturally
            // Based on their validate() methods:
            const searchResult = await player.search(query, {
                requestedBy: message.user
            });

            if (!searchResult || !searchResult.tracks.length) {
                const noResultEmbed = {
                    color: 0xff0000,
                    description: `**No results found for:** \`${query}\``,
                    timestamp: new Date()
                };
                return message.reply({ embeds: [noResultEmbed] });
            }

            const { track } = await player.play(message.member.voice.channel, searchResult, {
                nodeOptions: {
                    metadata: message,
                    ...config.player.leaveOptions
                }
            });

            const { useQueue } = require('discord-player');
            const queue = useQueue(message.guild.id);
            const queuePosition = queue ? queue.tracks.size + 1 : 1;

            if (message.author.id.startsWith('tiktok_')) {
                const textChannel = message.guild.channels.cache.get(process.env.DISCORD_CHANNEL_ID);
                if (textChannel) {
                    const tiktokEmbed = {
                        color: 0xff69b4, 
                        author: {
                            name: 'Track Added from TikTok'
                        },
                        description: `[**${track.title}**](${track.url || 'https://example.com'})`,
                        fields: [
                            {
                                name: 'Requested by',
                                value: `${message.author.username} (TikTok)`,
                                inline: true
                            },
                            {
                                name: 'Position in Queue',
                                value: `${queuePosition}`,
                                inline: true
                            }
                        ],
                        thumbnail: {
                            url: track.thumbnail || null
                        },
                        timestamp: new Date(),
                        footer: {
                            text: 'Kunang-Kunang • TikTok Integration'
                        }
                    };
                    await textChannel.send({ embeds: [tiktokEmbed] });
                }
                return; 
            }

            const successEmbed = {
                color: 0x00ff00,
                author: {
                    name: 'Added to queue'
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
                        name: 'Requested by',
                        value: message.author.toString(),
                        inline: true
                    }
                ],
                thumbnail: {
                    url: track.thumbnail || null
                },
                timestamp: new Date(),
                footer: {
                    text: `Position in queue: ${queuePosition}`
                }
            };
            return message.reply({ embeds: [successEmbed] });
        } catch (error) {
            Logger.error(`Play command error: ${error.message}`);
            console.error(error);
            
            let errorMessage = 'Something went wrong while trying to play that track!';
            
            if (error.message.includes('Sign in to confirm your age')) {
                errorMessage = 'This video is age-restricted and cannot be played!';
            } else if (error.message.includes('Video unavailable')) {
                errorMessage = 'This video is not available!';
            } else if (error.message.includes('Private video')) {
                errorMessage = 'This video is private and cannot be played!';
            }
            
            const errorEmbed = {
                color: 0xff0000,
                description: `**Error:** ${errorMessage}`,
                timestamp: new Date()
            };
            return message.reply({ embeds: [errorEmbed] });
        }
    }
};