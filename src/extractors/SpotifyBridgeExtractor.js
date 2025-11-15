import { BaseExtractor } from 'discord-player';
import { spotify } from 'btch-downloader';
import { Soundcloud } from 'soundcloud.ts';
import { Logger } from '../utils/logging.js';

class SpotifyBridgeExtractor extends BaseExtractor {
    static identifier = 'spotify-bridge';

    soundcloud = null;

    async activate() {
        Logger.debug('SpotifyBridgeExtractor: Activating extractor...');
        this.soundcloud = new Soundcloud(
            process.env.SOUNDCLOUD_CLIENT_ID,
            process.env.SOUNDCLOUD_OAUTH_TOKEN
        );
        Logger.debug('SpotifyBridgeExtractor: SoundCloud client initialized for Spotify bridge');
        return true;
    }

    async validate(query) {
        const isValid = this.isSpotifyURL(query);
        Logger.debug(`SpotifyBridgeExtractor: Validating query "${query?.substring(0, 50)}${query?.length > 50 ? '...' : ''}" - ${isValid ? 'valid Spotify URL' : 'not a Spotify URL'}`);
        return isValid;
    }

    async handle(query) {
        Logger.debug(`SpotifyBridgeExtractor: Handling query: "${query?.substring(0, 50)}${query?.length > 50 ? '...' : ''}"`);
        
        try {
            let tracks = [];

            if (this.isSpotifyURL(query)) {
                Logger.debug('SpotifyBridgeExtractor: Processing Spotify URL...');
                const spotifyData = await spotify(query);
                
                if (!spotifyData || !spotifyData.status || !spotifyData.result) {
                    Logger.debug('SpotifyBridgeExtractor: Invalid or empty Spotify data received');
                    return { playlist: null, tracks: [] };
                }

                const metadata = spotifyData.result;
                Logger.debug(`SpotifyBridgeExtractor: Retrieved Spotify metadata - "${metadata.title}" by ${metadata.artist}`);

                const searchQuery = `${metadata.title} ${metadata.artist || ''}`.trim();
                Logger.debug(`SpotifyBridgeExtractor: Searching SoundCloud for: "${searchQuery}"`);

                try {
                    const scSearchResults = await this.soundcloud.tracks.search({
                        q: searchQuery,
                        limit: 5
                    });

                    const scTracks = scSearchResults.collection || scSearchResults || [];
                    Logger.debug(`SpotifyBridgeExtractor: SoundCloud search returned ${scTracks.length} results`);

                    if (scTracks.length > 0) {
                        const bestMatch = scTracks[0];
                        const trackData = this.convertToTrackData(bestMatch, metadata);
                        tracks = [trackData];
                        Logger.debug(`SpotifyBridgeExtractor: Using best match: "${bestMatch.title}" by ${bestMatch.user?.username}`);
                    } else {
                        Logger.debug('SpotifyBridgeExtractor: No SoundCloud tracks found for Spotify song');
                    }
                } catch (scError) {
                    Logger.error(`SpotifyBridgeExtractor: SoundCloud search error: ${scError.message}`);
                    Logger.debug(`SpotifyBridgeExtractor: SoundCloud search failed - ${scError.message}`);
                }
            } else {
                Logger.debug('SpotifyBridgeExtractor: Query is not a Spotify URL, skipping');
            }

            Logger.debug(`SpotifyBridgeExtractor: Returning ${tracks.length} tracks`);
            return {
                playlist: null,
                tracks: tracks
            };
        } catch (error) {
            Logger.error(`SpotifyBridgeExtractor error: ${error.message}`);
            Logger.debug(`SpotifyBridgeExtractor: Handle method failed - ${error.message}`);
            return { playlist: null, tracks: [] };
        }
    }

    async stream(info) {
        Logger.debug(`SpotifyBridgeExtractor: Streaming track: "${info.title}"`);
        
        try {
            // Use SoundCloud's streamTrack for streaming
            if (info.raw && info.raw.permalink_url) {
                Logger.debug('SpotifyBridgeExtractor: Attempting SoundCloud streamTrack utility...');
                try {
                    const stream = await this.soundcloud.util.streamTrack(info.raw.permalink_url);
                    Logger.debug('SpotifyBridgeExtractor: StreamTrack utility successful');
                    return stream;
                } catch (streamError) {
                    Logger.debug('SpotifyBridgeExtractor: StreamTrack utility failed, trying fallback methods');
                    
                    // Fallback methods
                    if (info.raw.stream_url) {
                        Logger.debug('SpotifyBridgeExtractor: Using direct stream URL');
                        return `${info.raw.stream_url}?client_id=${process.env.SOUNDCLOUD_CLIENT_ID}`;
                    }
                    
                    // Re-fetch track info
                    Logger.debug('SpotifyBridgeExtractor: Attempting to refetch SoundCloud track info...');
                    try {
                        const freshTrack = await this.soundcloud.tracks.get(info.raw.id);
                        if (freshTrack.media?.transcodings?.length > 0) {
                            const transcoding = freshTrack.media.transcodings.find(t => 
                                t.format?.protocol === 'progressive' && t.format?.mime_type?.includes('audio')
                            ) || freshTrack.media.transcodings[0];
                            
                            if (transcoding?.url) {
                                const streamUrl = `${transcoding.url}?client_id=${process.env.SOUNDCLOUD_CLIENT_ID}`;
                                Logger.debug('SpotifyBridgeExtractor: Using transcoding stream URL');
                                return streamUrl;
                            }
                        }
                        Logger.debug('SpotifyBridgeExtractor: No suitable transcoding found');
                    } catch (refetchError) {
                        Logger.error(`SpotifyBridgeExtractor: Refetch error: ${refetchError.message}`);
                        Logger.debug(`SpotifyBridgeExtractor: Refetch failed - ${refetchError.message}`);
                    }
                }
            }

            Logger.debug(`SpotifyBridgeExtractor: Unable to extract stream for: ${info.title}`);
            throw new Error(`Unable to extract stream for: ${info.title}`);
        } catch (error) {
            Logger.error(`SpotifyBridgeExtractor stream error: ${error.message}`);
            Logger.debug(`SpotifyBridgeExtractor: Stream method failed - ${error.message}`);
            throw error;
        }
    }

    convertToTrackData(scTrack, spotifyMetadata) {
        return {
            title: spotifyMetadata?.title || scTrack.title || 'Unknown Title',
            description: scTrack.description || '',
            author: spotifyMetadata?.artist || scTrack.user?.username || 'Unknown Artist',
            url: scTrack.permalink_url || '',
            thumbnail: spotifyMetadata?.thumbnail || scTrack.artwork_url || scTrack.user?.avatar_url || null,
            duration: this.formatDuration(scTrack.duration),
            views: scTrack.playback_count || 0,
            source: 'spotify-soundcloud',
            engine: scTrack,
            live: false,
            raw: scTrack,
            metadata: {
                spotifyTitle: spotifyMetadata?.title,
                spotifyArtist: spotifyMetadata?.artist,
                soundcloudTrack: scTrack.id,
                genre: scTrack.genre,
                likes: scTrack.likes_count,
                reposts: scTrack.reposts_count
            }
        };
    }

    isSpotifyURL(url) {
        const spotifyUrlRegex = /^(https?:\/\/(open\.)?spotify\.com\/(track|album|playlist)\/[\w]+|spotify:(track|album|playlist):[\w]+)/;
        return spotifyUrlRegex.test(url);
    }

    formatDuration(ms) {
        if (!ms) return '0:00';
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
}

export { SpotifyBridgeExtractor };
