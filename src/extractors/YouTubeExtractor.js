const { BaseExtractor } = require('discord-player');
const { youtube, yts } = require('btch-downloader');

class YouTubeExtractor extends BaseExtractor {
    static identifier = 'youtube';

    async activate() {
        return true;
    }

    async validate(query) {
        return this.isYouTubeURL(query);
    }

    async handle(query) {
        try {
            let tracks = [];

            if (this.isYouTubeURL(query)) {
                const data = await youtube(query);
                if (data && data.result) {
                    tracks = [this.convertToTrackData(data.result)];
                } else if (data) {
                    tracks = [this.convertToTrackData(data)];
                }
            } else {
                const searchData = await yts(query);
                if (searchData && searchData.result && searchData.result.videos) {
                    tracks = searchData.result.videos.slice(0, 10).map(video => this.convertToTrackData(video));
                }
            }

            return {
                playlist: null,
                tracks: tracks
            };
        } catch (error) {
            console.error('YouTube extractor error:', error.message);
            return { playlist: null, tracks: [] };
        }
    }

    async stream(info) {
        try {
            if (info.raw && info.raw.mp3) {
                return info.raw.mp3;
            }
            if (info.raw && info.raw.mp4) {
                return info.raw.mp4;
            }

            if (info.url && this.isYouTubeURL(info.url)) {
                const data = await youtube(info.url);
                if (data && data.mp3) {
                    return data.mp3;
                }
                if (data && data.mp4) {
                    return data.mp4;
                }
            }

            throw new Error(`Unable to extract stream for: ${info.title}`);
        } catch (error) {
            console.error('YouTube stream error:', error.message);
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

module.exports = { YouTubeExtractor };