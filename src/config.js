module.exports = {
    // Bot settings
    bot: {
        prefix: '!',
        activity: {
            name: 'Kunang-Kunang Music',
            type: 2 // 0: PLAYING, 1: STREAMING, 2: LISTENING, 3: WATCHING, 5: COMPETING
        }
    },
    
    // Music player settings
    player: {
        defaultVolume: 100,
        defaultSearchEngine: 'soundcloud', // youtube, soundcloud, spotify
        maxQueueSize: 100,
        
        // Auto-leave settings (manual configuration)
        leaveOnEmpty: true, // Leave immediately when voice channel is empty
        leaveOnEnd: true, // Leave immediately when queue ends
        
        // Additional player options
        selfDeaf: true, // Bot will deafen itself when joining voice channels
        volume: 100, // Default volume (0-100)
        quality: 'high' // low, medium, high
    },
    
    // TikTok integration settings
    tiktok: {
        username: '', // TikTok username to connect to for live chat commands
        maxReconnectAttempts: 3,
        reconnectDelay: 5000, // 5 seconds in milliseconds
        enabled: false // Enable/disable TikTok bridge
    }
};