import { BaseExtractor, ExtractorSearchContext, ExtractorInfo } from 'discord-player';
import { Soundcloud } from 'soundcloud.ts';
import { Logger } from '../utils/logging.js';

class SoundCloudExtractor extends BaseExtractor {
    static identifier = 'soundcloud';
    soundcloud: Soundcloud | null = null;

    async activate(): Promise<void> {
        Logger.debug('SoundCloudExtractor: Activating extractor...');
        this.soundcloud = new Soundcloud(
            process.env.SOUNDCLOUD_CLIENT_ID,
            process.env.SOUNDCLOUD_OAUTH_TOKEN
        );
        Logger.debug('SoundCloudExtractor: SoundCloud client initialized');
    }

    async validate(query: string): Promise<boolean> {
        Logger.debug(`SoundCloudExtractor: Validating query: "${query?.substring(0, 50)}${query?.length > 50 ? '...' : ''}"`);
        
        if (typeof query !== 'string' || query.length === 0) {
            Logger.debug('SoundCloudExtractor: Query validation failed - not a string or empty');
            return false;
        }
        
        if (this.isSoundCloudURL(query)) {
            Logger.debug('SoundCloudExtractor: Query validation passed - SoundCloud URL detected');
            return true;
        }
        
        
        Logger.debug('SoundCloudExtractor: Query validation passed - general search query');
        return true; // accept queries because youtube extractor is disabled
    }

    async handle(query: string, context: ExtractorSearchContext): Promise<ExtractorInfo> {
        Logger.debug(`SoundCloudExtractor: Handling query: "${query?.substring(0, 50)}${query?.length > 50 ? '...' : ''}"`);
        
        if (!this.soundcloud) {
            Logger.debug('SoundCloudExtractor: SoundCloud client not initialized');
            return { playlist: null, tracks: [] };
        }

        try {
            let tracks = [];

            if (this.isSoundCloudURL(query)) {
                Logger.debug('SoundCloudExtractor: Processing SoundCloud URL');
                if (query.includes('/sets/')) {
                    Logger.debug('SoundCloudExtractor: Fetching playlist...');
                    const playlist = await this.soundcloud.playlists.getAlt(this.extractPath(query));
                    tracks = playlist.tracks || [];
                    Logger.debug(`SoundCloudExtractor: Retrieved playlist with ${tracks.length} tracks`);
                } else {
                    Logger.debug('SoundCloudExtractor: Fetching single track...');
                    const track = await this.soundcloud.tracks.get(this.extractPath(query));
                    tracks = [track];
                    Logger.debug('SoundCloudExtractor: Retrieved single track');
                }
            } else {
                Logger.debug('SoundCloudExtractor: Performing search...');
                if (!process.env.SOUNDCLOUD_CLIENT_ID) {
                    Logger.debug('SoundCloudExtractor: Search failed - no client ID');
                    return { playlist: null, tracks: [] };
                }
                
                const searchResults = await this.soundcloud.tracks.search({ 
                    q: query, 
                    limit: 10 
                });
                
                tracks = Array.isArray(searchResults) ? searchResults : (searchResults.collection || []);
                Logger.debug(`SoundCloudExtractor: Search returned ${tracks.length} results`);
            }

            if (tracks.length === 0) {
                Logger.debug('SoundCloudExtractor: No tracks found');
                return { playlist: null, tracks: [] };
            }

            const convertedTracks = tracks.map(track => this.convertToTrackData(track));
            Logger.debug(`SoundCloudExtractor: Converted ${convertedTracks.length} tracks to track data`);

            const result = {
                playlist: null,
                tracks: convertedTracks
            };

            Logger.debug(`SoundCloudExtractor: Returning ${result.tracks.length} tracks`);
            return result as unknown as ExtractorInfo;
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            Logger.error(`SoundCloudExtractor error: ${errorMsg}`);
            Logger.debug(`SoundCloudExtractor: Handle method failed - ${errorMsg}`);
            return { playlist: null, tracks: [] };
        }
    }

    async stream(info: any): Promise<string | any> {
        Logger.debug(`SoundCloudExtractor: Streaming track: "${info.title}"`);
        
        try {
            const soundcloudTrack = info.raw || info.engine;
            
            if (!this.soundcloud) {
                throw new Error('SoundCloud client not initialized');
            }
            
            // Method 1: Try streamTrack utility
            Logger.debug('SoundCloudExtractor: Attempting streamTrack utility...');
            try {
                const stream = await this.soundcloud.util!.streamTrack(soundcloudTrack.permalink_url);
                Logger.debug('SoundCloudExtractor: StreamTrack utility successful');
                return stream;
            } catch (streamError) {
                Logger.debug('SoundCloudExtractor: StreamTrack utility failed, trying fallback methods');
            }
            
            // Method 2: Try direct stream URL
            if (soundcloudTrack.stream_url) {
                const streamUrl = `${soundcloudTrack.stream_url}?client_id=${process.env.SOUNDCLOUD_CLIENT_ID}`;
                Logger.debug('SoundCloudExtractor: Using direct stream URL');
                return streamUrl;
            }
            
            // Method 3: Try to get track info again and extract stream
            Logger.debug('SoundCloudExtractor: Attempting to refetch track info...');
            try {
                const freshTrack = await this.soundcloud.tracks!.get(soundcloudTrack.id);
                
                if (freshTrack.media?.transcodings?.length > 0) {
                    const transcoding = freshTrack.media.transcodings.find(t => 
                        t.format?.protocol === 'progressive' && t.format?.mime_type?.includes('audio')
                    ) || freshTrack.media.transcodings[0];
                    
                    if (transcoding?.url) {
                        const streamUrl = `${transcoding.url}?client_id=${process.env.SOUNDCLOUD_CLIENT_ID}`;
                        Logger.debug('SoundCloudExtractor: Using transcoding stream URL');
                        return streamUrl;
                    }
                }
            } catch (refetchError) {
                Logger.debug('SoundCloudExtractor: Refetch failed');
            }
            
            Logger.debug(`SoundCloudExtractor: All streaming methods failed for track: ${soundcloudTrack.title}`);
            throw new Error(`Unable to extract stream for track: ${soundcloudTrack.title}`);
            
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            Logger.error(`SoundCloudExtractor stream error: ${errorMsg}`);
            Logger.debug(`SoundCloudExtractor: Stream method failed - ${errorMsg}`);
            throw error;
        }
    }

    convertToTrackData(soundcloudTrack: any): object {
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

    isSoundCloudURL(url: string): boolean {
        const soundcloudUrlRegex = /^https?:\/\/(www\.)?(soundcloud\.com|snd\.sc)\/.+/;
        return soundcloudUrlRegex.test(url);
    }

    extractPath(url: string): string {
        // Extract the path from SoundCloud URL
        // e.g., "https://soundcloud.com/user/track" -> "user/track"
        const match = url.match(/soundcloud\.com\/(.+)/);
        return match ? match[1] : url;
    }

    formatDuration(ms: number): string {
        if (!ms) return '0:00';
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
}

export { SoundCloudExtractor };