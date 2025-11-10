const { BaseExtractor } = require('discord-player');
const { spotify } = require('btch-downloader');
const Soundcloud = require('soundcloud.ts').default;

class SpotifyBridgeExtractor extends BaseExtractor {
    static identifier = 'spotify-bridge';

    soundcloud = null;

    async activate() {
        this.soundcloud = new Soundcloud(
            process.env.SOUNDCLOUD_CLIENT_ID,
            process.env.SOUNDCLOUD_OAUTH_TOKEN
        );
        return true;
    }

    async validate(query) {
        return this.isSpotifyURL(query);
    }

    async handle(query) {
        try {
            let tracks = [];

            if (this.isSpotifyURL(query)) {
                const spotifyData = await spotify(query);
                
                if (!spotifyData || !spotifyData.status || !spotifyData.result) {
                    return { playlist: null, tracks: [] };
                }

                const metadata = spotifyData.result;

                const searchQuery = `${metadata.title} ${metadata.artist || ''}`.trim();

                try {
                    const scSearchResults = await this.soundcloud.tracks.search({
                        q: searchQuery,
                        limit: 5
                    });

                    const scTracks = scSearchResults.collection || scSearchResults || [];

                    if (scTracks.length > 0) {
                        const bestMatch = scTracks[0];
                        const trackData = this.convertToTrackData(bestMatch, metadata);
                        tracks = [trackData];
                    }
                } catch (scError) {
                    console.error('SpotifyBridgeExtractor: SoundCloud search error:', scError.message);
                }
            }

            return {
                playlist: null,
                tracks: tracks
            };
        } catch (error) {
            console.error('SpotifyBridgeExtractor error:', error.message);
            return { playlist: null, tracks: [] };
        }
    }

    async stream(info) {
        try {
            // Use SoundCloud's streamTrack for streaming
            if (info.raw && info.raw.permalink_url) {
                try {
                    const stream = await this.soundcloud.util.streamTrack(info.raw.permalink_url);
                    return stream;
                } catch (streamError) {
                    // Fallback methods
                    if (info.raw.stream_url) {
                        return `${info.raw.stream_url}?client_id=${process.env.SOUNDCLOUD_CLIENT_ID}`;
                    }
                    
                    // Re-fetch track info
                    try {
                        const freshTrack = await this.soundcloud.tracks.get(info.raw.id);
                        if (freshTrack.media?.transcodings?.length > 0) {
                            const transcoding = freshTrack.media.transcodings.find(t => 
                                t.format?.protocol === 'progressive' && t.format?.mime_type?.includes('audio')
                            ) || freshTrack.media.transcodings[0];
                            
                            if (transcoding?.url) {
                                return `${transcoding.url}?client_id=${process.env.SOUNDCLOUD_CLIENT_ID}`;
                            }
                        }
                    } catch (refetchError) {
                        console.error('SpotifyBridgeExtractor: Refetch error:', refetchError.message);
                    }
                }
            }

            throw new Error(`Unable to extract stream for: ${info.title}`);
        } catch (error) {
            console.error('SpotifyBridgeExtractor stream error:', error.message);
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

module.exports = { SpotifyBridgeExtractor };
