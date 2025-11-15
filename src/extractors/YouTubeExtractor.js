import { BaseExtractor } from 'discord-player';
import { youtube, yts } from 'btch-downloader';
import { Logger } from '../utils/logging.js';

class YouTubeExtractor extends BaseExtractor {
    static identifier = 'youtube';

    async activate() {
        Logger.debug('YouTubeExtractor: Activating extractor...');
        return true;
    }

    async validate(query) {
        const isValid = this.isYouTubeURL(query);
        Logger.debug(`YouTubeExtractor: Validating query "${query?.substring(0, 50)}${query?.length > 50 ? '...' : ''}" - ${isValid ? 'valid YouTube URL' : 'not a YouTube URL'}`);
        return isValid;
    }

    async handle(query) {
        Logger.debug(`YouTubeExtractor: Handling query: "${query?.substring(0, 50)}${query?.length > 50 ? '...' : ''}"`);
        
        try {
            let tracks = [];

            if (this.isYouTubeURL(query)) {
                Logger.debug('YouTubeExtractor: Processing YouTube URL...');
                const data = await youtube(query);
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
                const searchData = await yts(query);
                if (searchData && searchData.result && searchData.result.videos) {
                    tracks = searchData.result.videos.slice(0, 10).map(video => this.convertToTrackData(video));
                    Logger.debug(`YouTubeExtractor: Search returned ${tracks.length} videos`);
                } else {
                    Logger.debug('YouTubeExtractor: No search results found');
                }
            }

            Logger.debug(`YouTubeExtractor: Returning ${tracks.length} tracks`);
            return {
                playlist: null,
                tracks: tracks
            };
        } catch (error) {
            Logger.error(`YouTubeExtractor error: ${error.message}`);
            Logger.debug(`YouTubeExtractor: Handle method failed - ${error.message}`);
            return { playlist: null, tracks: [] };
        }
    }

    async stream(info) {
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
            Logger.error(`YouTubeExtractor stream error: ${error.message}`);
            Logger.debug(`YouTubeExtractor: Stream method failed - ${error.message}`);
            throw error;
        }
    }

    convertToTrackData(videoData) {
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

    isYouTubeURL(url) {
        const youtubeUrlRegex = /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=[^&\n?#]+|youtu\.be\/[^&\n?#]+|youtube\.com\/embed\/[^&\n?#]+|youtube\.com\/v\/[^&\n?#]+)/;
        return youtubeUrlRegex.test(url);
    }

    formatDuration(duration) {
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

    parseViews(views) {
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