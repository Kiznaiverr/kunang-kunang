module.exports = {
    // Utility functions for the bot
    
    formatTime(ms) {
        const minutes = Math.floor(ms / 60000);
        const seconds = ((ms % 60000) / 1000).toFixed(0);
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    },

    createProgressBar(current, total, length = 20) {
        const progress = Math.round((current / total) * length);
        const empty = length - progress;
        
        const progressText = '='.repeat(progress);
        const emptyText = '-'.repeat(empty);
        
        return `[${progressText}${emptyText}]`;
    },

    /**
     * @param {number} ms - Time in milliseconds.
     * @returns {Promise<void>}
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    /**
     * Check whether the given URL is valid.
     *
     * @param {string} str - The URL string.
     * @returns {boolean} `true` if the given URL is valid; `false` otherwise.
     */
    isValidURL(str) {
        if (typeof str !== 'string') return false;  // not a string is invalid
        const trimmed = str.trim();
        if (!trimmed) return false;  // empty string is invalid URL
        try {
            new URL(trimmed);
            return true;

            // ? Should we just use this logic below?
            // ? It provides better detection for HTTP and HTTPS protocols
            // ? which is the valid for website URLs
            // ---
            // return url.protocol === 'http:' || url.protocol === 'https:';
        } catch (_) {
            return false;
        }
    }
};