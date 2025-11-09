/**
 * Kunang-Kunang Music Overlay
 * Polling-based overlay for OBS browser source with preset support
 */

class MusicOverlay {
    constructor() {
        this.pollingInterval = 5000; // dont change here, change in config.js
        this.pollingId = null;
        this.lastData = null;
        this.isConnected = false;
        this.currentPreset = 1; // Default preset

        this.init();
    }

    init() {
        console.log('Initializing Kunang-Kunang Music Overlay...');
        this.bindElements();
        this.startPolling();
    }

    bindElements() {
        this.elements = {
            overlay: document.getElementById('overlay'),
            overlayContainer: document.getElementById('overlay-container'),
            statusIndicator: document.querySelector('.status-indicator'),
            trackTitle: document.getElementById('track-title'),
            trackAuthor: document.getElementById('track-author'),
            trackThumbnail: document.getElementById('track-thumbnail'),
            thumbnailImg: document.getElementById('thumbnail-img'),
            queueList: document.getElementById('queue-list'),
            equalizer: document.querySelector('.equalizer')
        };
    }

    startPolling() {
        this.fetchData();

        this.pollingId = setInterval(() => {
            this.fetchData();
        }, this.pollingInterval);

        console.log(`Started polling every ${this.pollingInterval}ms`);
    }

    stopPolling() {
        if (this.pollingId) {
            clearInterval(this.pollingId);
            this.pollingId = null;
            console.log('Stopped polling');
        }
    }

    async fetchData() {
        try {
            const response = await fetch('/api/nowplaying');
            const data = await response.json();

            if (data.pollingInterval && data.pollingInterval !== this.pollingInterval) {
                console.log(`Updating polling interval to ${data.pollingInterval}ms`);
                this.pollingInterval = data.pollingInterval;
                this.restartPolling();
            }

            // Update preset if changed
            if (data.preset && data.preset !== this.currentPreset) {
                this.updatePreset(data.preset);
            }

            this.updateOverlay(data);
            this.updateConnectionStatus(true);

        } catch (error) {
            console.error('Failed to fetch overlay data:', error);
            this.updateConnectionStatus(false);
        }
    }

    updatePreset(presetNumber) {
        this.currentPreset = presetNumber;
        
        // Remove all preset classes
        if (this.elements.overlayContainer) {
            this.elements.overlayContainer.classList.remove('preset-1', 'preset-2', 'preset-3', 'preset-4');
            
            // Add the new preset class
            this.elements.overlayContainer.classList.add(`preset-${presetNumber}`);
            
            // Dynamically load the preset CSS
            this.loadPresetCSS(presetNumber);
            
            console.log(`Switched to preset ${presetNumber}`);
        }
    }

    loadPresetCSS(presetNumber) {
        const presetCssLink = document.getElementById('preset-css');
        if (presetCssLink) {
            presetCssLink.href = `css/preset${presetNumber}.css`;
        }
    }

    updateOverlay(data) {
        this.lastData = data;

        this.updateNowPlaying(data.current, data.isPlaying);

        this.updateQueue(data.queue);

        this.updateLastUpdate(data.lastUpdate);
    }

    updateNowPlaying(track, isPlaying) {
        const thumbnailElement = this.elements.trackThumbnail;
        const equalizerElement = this.elements.equalizer;
        const statusElement = this.elements.statusIndicator;
        const overlayContainer = this.elements.overlayContainer;

        if (track) {
            this.elements.trackTitle.textContent = track.title || 'Unknown Track';
            this.elements.trackAuthor.textContent = track.author || 'Unknown Artist';

            if (track.thumbnail) {
                this.elements.thumbnailImg.src = track.thumbnail;
                this.elements.thumbnailImg.style.display = 'block';
            } else {
                this.elements.thumbnailImg.style.display = 'none';
            }

            // Update animations
            if (thumbnailElement) {
                if (isPlaying) {
                    thumbnailElement.classList.add('playing');
                } else {
                    thumbnailElement.classList.remove('playing');
                }
            }

            if (equalizerElement) {
                if (isPlaying) {
                    equalizerElement.classList.add('playing');
                } else {
                    equalizerElement.classList.remove('playing');
                }
            }

            // Update overlay container for playing state
            if (overlayContainer) {
                if (isPlaying) {
                    overlayContainer.classList.add('playing');
                } else {
                    overlayContainer.classList.remove('playing');
                }
            }

            // Update status indicator for playing state
            if (statusElement) {
                if (isPlaying) {
                    statusElement.classList.remove('connected', 'idle', 'disconnected');
                    statusElement.classList.add('playing');
                } else {
                    statusElement.classList.remove('playing', 'idle', 'disconnected');
                    statusElement.classList.add('connected');
                }
            }

        } else {
            this.elements.trackTitle.textContent = 'No song playing';
            this.elements.trackAuthor.textContent = 'Add songs to the queue';
            this.elements.thumbnailImg.style.display = 'none';
            
            if (thumbnailElement) {
                thumbnailElement.classList.remove('playing');
            }
            if (equalizerElement) {
                equalizerElement.classList.remove('playing');
            }
            if (overlayContainer) {
                overlayContainer.classList.remove('playing');
            }

            // Update status indicator for idle state
            if (statusElement) {
                statusElement.classList.remove('connected', 'playing', 'disconnected');
                statusElement.classList.add('idle');
            }
        }
    }    updateQueue(queue) {
        const queueList = this.elements.queueList;
        console.log('Updating queue display:', queue);

        if (!queue || queue.length === 0) {
            queueList.innerHTML = '<span class="queue-item-inline">No songs in queue</span>';
            return;
        }

        // Show only first 2 tracks inline with " • " separator
        const queueText = queue.slice(0, 2).map(song => song.title || 'Unknown Track').join(' • ');
        const moreCount = queue.length > 2 ? ` +${queue.length - 2} more` : '';
        
        queueList.innerHTML = `<span class="queue-item-inline">${queueText}${moreCount}</span>`;
        console.log('Queue display updated:', queueText + moreCount);
    }

    updateLastUpdate(timestamp) {
        if (timestamp) {
            const date = new Date(timestamp);
            const timeString = date.toLocaleTimeString();
            this.elements.lastUpdate.textContent = `Last update: ${timeString}`;
        }
    }

    updateConnectionStatus(connected) {
        this.isConnected = connected;
        const statusElement = this.elements.statusIndicator;

        if (statusElement) {
            // Remove all status classes
            statusElement.classList.remove('connected', 'playing', 'idle', 'disconnected');
            
            if (connected) {
                statusElement.classList.add('connected');
                statusElement.style.display = 'block';
            } else {
                statusElement.classList.add('disconnected');
                statusElement.style.display = 'block';
            }
        }
    }

    restartPolling() {
        this.stopPolling();
        this.startPolling();
    }

    setPollingInterval(interval) {
        if (interval >= 1000 && interval <= 60000) { // 1 second to 1 minute
            this.pollingInterval = interval;
            this.restartPolling();
            console.log(`Polling interval set to ${interval}ms`);
        } else {
            console.warn('Polling interval must be between 1000-60000ms');
        }
    }

    getStatus() {
        return {
            isConnected: this.isConnected,
            lastData: this.lastData,
            pollingInterval: this.pollingInterval,
            currentPreset: this.currentPreset
        };
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.musicOverlay = new MusicOverlay();
});

window.setPollingInterval = (interval) => {
    if (window.musicOverlay) {
        window.musicOverlay.setPollingInterval(interval);
    }
};

window.getOverlayStatus = () => {
    if (window.musicOverlay) {
        return window.musicOverlay.getStatus();
    }
};