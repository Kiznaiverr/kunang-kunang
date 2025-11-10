const { BaseExtractor } = require('discord-player');
const Soundcloud = require('soundcloud.ts').default;

class SoundCloudExtractor extends BaseExtractor {
    static identifier = 'soundcloud';

    async activate() {
        this.soundcloud = new Soundcloud(
            process.env.SOUNDCLOUD_CLIENT_ID,
            process.env.SOUNDCLOUD_OAUTH_TOKEN
        );
        return true;
    }

    async validate(query) {
        if (typeof query !== 'string' || query.length === 0) {
            return false;
        }
        
        if (this.isSoundCloudURL(query)) {
            return true;
        }
        
        return true;
    }

    async handle(query) {
        if (!this.soundcloud) {
            return { playlist: null, tracks: [] };
        }

        try {
            let tracks = [];

            if (this.isSoundCloudURL(query)) {
                if (query.includes('/sets/')) {
                    const playlist = await this.soundcloud.playlists.getAlt(this.extractPath(query));
                    tracks = playlist.tracks || [];
                } else {
                    const track = await this.soundcloud.tracks.get(this.extractPath(query));
                    tracks = [track];
                }
            } else {
                if (!process.env.SOUNDCLOUD_CLIENT_ID) {
                    return { playlist: null, tracks: [] };
                }
                
                const searchResults = await this.soundcloud.tracks.search({ 
                    q: query, 
                    limit: 10 
                });
                
                tracks = searchResults.collection || searchResults || [];
            }

            if (tracks.length === 0) {
                return { playlist: null, tracks: [] };
            }

            const convertedTracks = tracks.map(track => this.convertToTrackData(track));

            const result = {
                playlist: null,
                tracks: convertedTracks
            };

            return result;
        } catch (error) {
            console.error('SoundCloud extractor error:', error.message);
            return { playlist: null, tracks: [] };
        }
    }

    async stream(info) {
        try {
            const soundcloudTrack = info.raw || info.engine;
            
            // Method 1: Try streamTrack utility
            try {
                const stream = await this.soundcloud.util.streamTrack(soundcloudTrack.permalink_url);
                return stream;
            } catch (streamError) {
                // Continue to fallback methods
            }
            
            // Method 2: Try direct stream URL
            if (soundcloudTrack.stream_url) {
                const streamUrl = `${soundcloudTrack.stream_url}?client_id=${process.env.SOUNDCLOUD_CLIENT_ID}`;
                return streamUrl;
            }
            
            // Method 3: Try to get track info again and extract stream
            try {
                const freshTrack = await this.soundcloud.tracks.get(soundcloudTrack.id);
                
                if (freshTrack.media?.transcodings?.length > 0) {
                    const transcoding = freshTrack.media.transcodings.find(t => 
                        t.format?.protocol === 'progressive' && t.format?.mime_type?.includes('audio')
                    ) || freshTrack.media.transcodings[0];
                    
                    if (transcoding?.url) {
                        const streamUrl = `${transcoding.url}?client_id=${process.env.SOUNDCLOUD_CLIENT_ID}`;
                        return streamUrl;
                    }
                }
            } catch (refetchError) {
                // Continue to error
            }
            
            throw new Error(`Unable to extract stream for track: ${soundcloudTrack.title}`);
            
        } catch (error) {
            console.error('SoundCloud stream error:', error.message);
            throw error;
        }
    }

    convertToTrackData(soundcloudTrack) {
        return {
            title: soundcloudTrack.title || 'Unknown Title',
            description: soundcloudTrack.description || '',
            author: soundcloudTrack.user?.username || 'Unknown Artist',
            url: soundcloudTrack.permalink_url || '',
            thumbnail: soundcloudTrack.artwork_url || soundcloudTrack.user?.avatar_url || null,
            duration: this.formatDuration(soundcloudTrack.duration),
            views: soundcloudTrack.playback_count || 0,
            source: 'soundcloud',
            engine: soundcloudTrack,
            live: false,
            raw: soundcloudTrack,
            metadata: {
                genre: soundcloudTrack.genre,
                tags: soundcloudTrack.tag_list,
                createdAt: soundcloudTrack.created_at,
                likes: soundcloudTrack.likes_count,
                reposts: soundcloudTrack.reposts_count,
                comments: soundcloudTrack.comment_count
            }
        };
    }

    isSoundCloudURL(url) {
        const soundcloudUrlRegex = /^https?:\/\/(www\.)?(soundcloud\.com|snd\.sc)\/.+/;
        return soundcloudUrlRegex.test(url);
    }

    extractPath(url) {
        // Extract the path from SoundCloud URL
        // e.g., "https://soundcloud.com/user/track" -> "user/track"
        const match = url.match(/soundcloud\.com\/(.+)/);
        return match ? match[1] : url;
    }

    formatDuration(ms) {
        if (!ms) return '0:00';
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
}

module.exports = { SoundCloudExtractor };