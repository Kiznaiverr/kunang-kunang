import { BaseExtractor, ExtractorSearchContext, ExtractorInfo } from 'discord-player';
import { youtube, yts } from 'btch-downloader';
import { Logger } from '../utils/logging.js';

class YouTubeExtractor extends BaseExtractor {
    static identifier = 'youtube';

    async activate(): Promise<void> {
        Logger.debug('YouTubeExtractor: Activating extractor...');
    }

    async validate(query: string): Promise<boolean> {
        if (typeof query !== 'string' || query.length === 0) {
            Logger.debug(`YouTubeExtractor: Validating query "${query?.substring(0, 50)}${query?.length > 50 ? '...' : ''}" - invalid query (not a string or empty)`);
            return false;
        }

        // Accept YouTube URLs
        if (this.isYouTubeURL(query)) {
            Logger.debug(`YouTubeExtractor: Validating query "${query?.substring(0, 50)}${query?.length > 50 ? '...' : ''}" - valid YouTube URL`);
            return true;
        }

        // Accept search queries (not URLs from other platforms)
        const isUrl = /^https?:\/\//.test(query);
        if (isUrl) {
            // Reject URLs from other platforms (SoundCloud, Spotify, etc.)
            Logger.debug(`YouTubeExtractor: Validating query "${query?.substring(0, 50)}${query?.length > 50 ? '...' : ''}" - rejecting non-YouTube URL`);
            return false;
        }

        // Accept general search queries
        Logger.debug(`YouTubeExtractor: Validating query "${query?.substring(0, 50)}${query?.length > 50 ? '...' : ''}" - valid search query`);
        return true;
    }

    async handle(query: string, context: ExtractorSearchContext): Promise<ExtractorInfo> {
        Logger.debug(`YouTubeExtractor: Handling query: "${query?.substring(0, 50)}${query?.length > 50 ? '...' : ''}"`);
        
        try {
            let tracks: any[] = [];

            if (this.isYouTubeURL(query)) {
                Logger.debug('YouTubeExtractor: Processing YouTube URL...');
                const data = await youtube(query) as any;
                if (data && data.result) {
                    tracks = [this.convertToTrackData(data.result)];
                    Logger.debug('YouTubeExtractor: Retrieved single video from URL');
                } else if (data) {
                    tracks = [this.convertToTrackData(data)];
                    Logger.debug('YouTubeExtractor: Retrieved video data from URL');
                } else {
                    Logger.debug('YouTubeExtractor: No video data found for URL');
                }
            } else {
                Logger.debug('YouTubeExtractor: Performing search...');
                const searchData = await yts(query) as any;
                if (searchData && searchData.result && searchData.result.videos) {
                    tracks = searchData.result.videos.slice(0, 10).map((video: any) => this.convertToTrackData(video));
                    Logger.debug(`YouTubeExtractor: Search returned ${tracks.length} videos`);
                    
                    // Add delay after search to ensure data stability
                    await new Promise(resolve => setTimeout(resolve, 100));
                } else {
                    Logger.debug('YouTubeExtractor: No search results found');
                }
            }

            Logger.debug(`YouTubeExtractor: Returning ${tracks.length} tracks`);
            return {
                playlist: null,
                tracks: tracks
            } as unknown as ExtractorInfo;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            Logger.error(`YouTubeExtractor error: ${errorMessage}`);
            Logger.debug(`YouTubeExtractor: Handle method failed - ${errorMessage}`);
            return { playlist: null, tracks: [] };
        }
    }

    async stream(info: any): Promise<string> {
        Logger.debug(`YouTubeExtractor: Streaming track: "${info.title}"`);
        
        try {
            // Try to get stream from raw data first
            if (info.raw && info.raw.mp3) {
                Logger.debug('YouTubeExtractor: Using cached MP3 stream URL');
                return info.raw.mp3;
            }
            if (info.raw && info.raw.mp4) {
                Logger.debug('YouTubeExtractor: Using cached MP4 stream URL');
                return info.raw.mp4;
            }

            // Fetch fresh data if needed
            if (info.url && this.isYouTubeURL(info.url)) {
                Logger.debug('YouTubeExtractor: Fetching fresh stream data...');
                const data = await youtube(info.url);
                if (data && data.mp3) {
                    Logger.debug('YouTubeExtractor: Retrieved MP3 stream URL');
                    return data.mp3;
                }
                if (data && data.mp4) {
                    Logger.debug('YouTubeExtractor: Retrieved MP4 stream URL');
                    return data.mp4;
                }
                Logger.debug('YouTubeExtractor: No stream URLs found in fresh data');
            }

            Logger.debug(`YouTubeExtractor: Unable to extract stream for: ${info.title}`);
            throw new Error(`Unable to extract stream for: ${info.title}`);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            Logger.error(`YouTubeExtractor stream error: ${errorMessage}`);
            Logger.debug(`YouTubeExtractor: Stream method failed - ${errorMessage}`);
            throw error;
        }
    }

    convertToTrackData(videoData: any): any {
        const isSearchResult = videoData.type === 'video';
        
        return {
            title: videoData.title || 'Unknown Title',
            description: videoData.description || '',
            author: isSearchResult ? (videoData.author?.name || 'Unknown Artist') : (videoData.author || 'Unknown Artist'),
            url: videoData.url || '',
            thumbnail: videoData.thumbnail || videoData.image || null,
            duration: this.formatDuration(isSearchResult ? videoData.duration : videoData.duration),
            views: this.parseViews(videoData.views) || 0,
            source: 'youtube',
            engine: videoData,
            live: false,
            raw: videoData,
            metadata: {
                videoId: videoData.videoId,
                channel: isSearchResult ? videoData.author?.name : videoData.author,
                uploadDate: videoData.ago,
                genre: videoData.genre
            }
        };
    }

    isYouTubeURL(url: string): boolean {
        const youtubeUrlRegex = /^https?:\/\/(www\.|m\.|music\.)?youtube\.com\/(watch\?v=[^&\n?#]+|embed\/[^&\n?#]+|v\/[^&\n?#]+|shorts\/[^&\n?#]+)|https?:\/\/youtu\.be\/[^&\n?#]+/;
        return youtubeUrlRegex.test(url);
    }

    formatDuration(duration: any): string {
        if (!duration) return '0:00';

        if (typeof duration === 'object' && duration.timestamp) {
            return duration.timestamp;
        }

        if (typeof duration === 'string') {
            if (duration.includes(':')) {
                return duration;
            }
            const seconds = parseInt(duration);
            if (!isNaN(seconds)) {
                const mins = Math.floor(seconds / 60);
                const secs = seconds % 60;
                return `${mins}:${secs.toString().padStart(2, '0')}`;
            }
        }

        if (typeof duration === 'number') {
            const mins = Math.floor(duration / 60);
            const secs = duration % 60;
            return `${mins}:${secs.toString().padStart(2, '0')}`;
        }

        return '0:00';
    }

    parseViews(views: any): number {
        if (!views) return 0;

        if (typeof views === 'number') return views;

        if (typeof views === 'string') {
            const cleanViews = views.replace(/,/g, '');
            const match = cleanViews.match(/(\d+)/);
            return match ? parseInt(match[1]) : 0;
        }

        return 0;
    }
}

export { YouTubeExtractor };