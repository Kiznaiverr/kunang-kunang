import { useMainPlayer, useQueue, SearchResult, Track } from 'discord-player';
import { Message, EmbedBuilder, TextChannel } from 'discord.js';
import config from '../config.js';
import { Logger } from '../utils/logging.js';
import { Command } from '../types/command.js';
import { SoundCloudExtractor } from '../extractors/SoundCloudExtractor.js';

const playCommand: Command = {
    name: 'play',
    description: 'Play a song',
    execute: async (message: Message, args: string[], bot: any): Promise<any> => {
        Logger.command(`play ${args.join(' ')}`, message.author.username);
        Logger.debug(`Play command initiated by ${message.author.username} in guild ${message.guild?.name}`, 'PlayCommand');
        
        const player = useMainPlayer();

        if (!message.member?.voice.channel) {
            Logger.debug('User not in voice channel', 'PlayCommand');
            const embed = new EmbedBuilder()
                .setColor(0xff0000)
                .setTitle('Error')
                .setDescription('You need to be in a voice channel to play music!')
                .setTimestamp()
                .setFooter({ text: 'Kunang-Kunang' });
            return message.reply({ embeds: [embed] });
        }

        if (!args.length) {
            const embed = new EmbedBuilder()
                .setColor(0xff0000)
                .setTitle('Error')
                .setDescription('Please provide a song name or URL!')
                .setTimestamp()
                .setFooter({ text: 'Kunang-Kunang' });
            return message.reply({ embeds: [embed] });
        }

        const query = args.join(' ');
        Logger.debug(`Searching for: "${query}"`, 'PlayCommand');

        try {
            // Don't specify searchEngine parameter - let extractors validate naturally
            // Based on their validate() methods:
            const searchResult = await player.search(query, {
                requestedBy: message.author as any
            });

            Logger.debug(`Search completed, found ${searchResult?.tracks?.length || 0} tracks`, 'PlayCommand');

            let finalSearchResult: SearchResult | null = searchResult;
            let tracksToPlay: Track[] = [];

            // Smart fallback mechanism
            if (!searchResult || !searchResult.tracks.length) {
                Logger.debug('Primary search failed, trying smart fallback...', 'PlayCommand');

                // If SoundCloud URL failed, try YouTube search with extracted title
                if (query.match(/^https?:\/\/(www\.)?(soundcloud\.com|snd\.sc)/)) {
                    Logger.debug('SoundCloud URL failed, trying YouTube search with extracted title...', 'PlayCommand');
                    try {
                        // Extract title from SoundCloud URL (basic extraction)
                        const urlParts = query.split('/');
                        const titlePart = urlParts[urlParts.length - 1].replace(/-/g, ' ');
                        const searchQuery = titlePart.charAt(0).toUpperCase() + titlePart.slice(1);

                        Logger.debug(`Searching YouTube for: "${searchQuery}"`, 'PlayCommand');
                        const youtubeFallback = await player.search(searchQuery, {
                            requestedBy: message.author as any
                        });

                        if (youtubeFallback && youtubeFallback.tracks.length > 0) {
                            Logger.debug(`YouTube fallback successful, found ${youtubeFallback.tracks.length} tracks`, 'PlayCommand');
                            finalSearchResult = youtubeFallback;
                        } else {
                            Logger.debug('YouTube fallback also failed', 'PlayCommand');
                        }
                    } catch (fallbackError) {
                        const fallbackErrorMsg = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
                        Logger.debug(`YouTube fallback error: ${fallbackErrorMsg}`, 'PlayCommand');
                    }
                }
                // If YouTube URL failed, try SoundCloud search
                else if (query.match(/^https?:\/\/(www\.|m\.|music\.)?youtube\.com\/|https?:\/\/youtu\.be\//)) {
                    Logger.debug('YouTube URL failed, trying SoundCloud search...', 'PlayCommand');
                    try {
                        const soundcloudExtractor = new (SoundCloudExtractor as any)(player.extractors.context, {});
                        await soundcloudExtractor.activate();
                        const soundcloudResult = await soundcloudExtractor.handle(query, {
                            requestedBy: message.author as any
                        });

                        if (soundcloudResult && soundcloudResult.tracks.length > 0) {
                            Logger.debug(`SoundCloud fallback successful, found ${soundcloudResult.tracks.length} tracks`, 'PlayCommand');
                            tracksToPlay = soundcloudResult.tracks;
                            finalSearchResult = null;
                        } else {
                            Logger.debug('SoundCloud fallback also failed', 'PlayCommand');
                        }
                    } catch (fallbackError) {
                        const fallbackErrorMsg = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
                        Logger.debug(`SoundCloud fallback error: ${fallbackErrorMsg}`, 'PlayCommand');
                    }
                }
                // If general search failed, try SoundCloud search
                else {
                    Logger.debug('General search failed, trying SoundCloud search...', 'PlayCommand');
                    try {
                        const soundcloudExtractor = new (SoundCloudExtractor as any)(player.extractors.context, {});
                        await soundcloudExtractor.activate();
                        const soundcloudResult = await soundcloudExtractor.handle(query, {
                            requestedBy: message.author as any
                        });

                        if (soundcloudResult && soundcloudResult.tracks.length > 0) {
                            Logger.debug(`SoundCloud fallback successful, found ${soundcloudResult.tracks.length} tracks`, 'PlayCommand');
                            tracksToPlay = soundcloudResult.tracks;
                            finalSearchResult = null;
                        } else {
                            Logger.debug('SoundCloud fallback also failed', 'PlayCommand');
                        }
                    } catch (fallbackError) {
                        const fallbackErrorMsg = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
                        Logger.debug(`SoundCloud fallback error: ${fallbackErrorMsg}`, 'PlayCommand');
                    }
                }
            }

            if ((!finalSearchResult && tracksToPlay.length === 0) || (finalSearchResult && finalSearchResult.tracks.length === 0)) {
                Logger.debug('No search results found from any extractor', 'PlayCommand');
                const noResultEmbed = new EmbedBuilder()
                    .setColor(0xff0000)
                    .setDescription(`**No results found for:** \`${query}\``)
                    .setTimestamp();
                return message.reply({ embeds: [noResultEmbed] });
            }

            const { track } = await player.play(message.member.voice.channel as any, finalSearchResult || tracksToPlay, {
                nodeOptions: {
                    metadata: message,
                    ...config.player.leaveOptions
                }
            });

            Logger.debug(`Track queued: ${track.title} by ${track.author}`, 'PlayCommand');

            if (!message.guild) {
                Logger.debug('Message not in guild after track queued', 'PlayCommand');
                return;
            }

            const queue = useQueue(message.guild.id);
            const queuePosition = queue ? queue.tracks.size + 1 : 1;

            if (message.author.id.startsWith('tiktok_')) {
                Logger.debug('Track requested from TikTok, sending to text channel', 'PlayCommand');
                const channelId = process.env.DISCORD_CHANNEL_ID;
                if (channelId) {
                    const textChannel = message.guild?.channels.cache.get(channelId) as TextChannel | undefined;
                    if (textChannel) {
                        const tiktokEmbed = new EmbedBuilder()
                            .setColor(0xff69b4)
                            .setAuthor({ name: 'Track Added from TikTok' })
                            .setDescription(`[**${track.title}**](${track.url || 'https://example.com'})`)
                            .addFields(
                                { name: 'Requested by', value: `${message.author.username} (TikTok)`, inline: true },
                                { name: 'Position in Queue', value: `${queuePosition}`, inline: true }
                            )
                            .setThumbnail(track.thumbnail || null)
                            .setTimestamp()
                            .setFooter({ text: 'Kunang-Kunang • TikTok Integration' });
                        await textChannel.send({ embeds: [tiktokEmbed] });
                    }
                }
                return; 
            }

            const successEmbed = new EmbedBuilder()
                .setColor(0x00ff00)
                .setAuthor({ name: 'Added to queue' })
                .setDescription(`[**${track.title}**](${track.url || 'https://example.com'})`)
                .addFields(
                    { name: 'Channel', value: track.author || 'Unknown', inline: true },
                    { name: 'Duration', value: track.duration || 'Unknown', inline: true },
                    { name: 'Requested by', value: message.author.toString(), inline: true }
                )
                .setThumbnail(track.thumbnail || null)
                .setTimestamp()
                .setFooter({ text: `Position in queue: ${queuePosition}` });
            return message.reply({ embeds: [successEmbed] });
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            Logger.debug(`Play command failed: ${errorMsg}`, 'PlayCommand');
            Logger.error(`Play command error: ${errorMsg}`);
            console.error(error);
            
            let errorMessage = 'Something went wrong while trying to play that track!';
            
            if (errorMsg.includes('Sign in to confirm your age')) {
                errorMessage = 'This video is age-restricted and cannot be played!';
            } else if (errorMsg.includes('Video unavailable')) {
                errorMessage = 'This video is not available!';
            } else if (errorMsg.includes('Private video')) {
                errorMessage = 'This video is private and cannot be played!';
            }
            
            const errorEmbed = new EmbedBuilder()
                .setColor(0xff0000)
                .setDescription(`**Error:** ${errorMessage}`)
                .setTimestamp();
            return message.reply({ embeds: [errorEmbed] });
        }
    }
};

export default playCommand;