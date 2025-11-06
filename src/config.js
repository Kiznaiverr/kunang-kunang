module.exports = {
    // Bot settings
    bot: {
        prefix: '!',
        activity: {
            name: 'Kunang-Kunang Music',
            type: 2 // 0: PLAYING, 1: STREAMING, 2: LISTENING, 3: WATCHING, 5: COMPETING
        }
    },
    
    player: {
        defaultVolume: 100,
        defaultSearchEngine: 'soundcloud', // youtube, soundcloud, spotify
        maxQueueSize: 100,
        
        selfDeaf: true, // Bot will deafen itself when joining voice channels
        volume: 100, // Default volume (0-100)
        quality: 'high' // low, medium, high
    },
    
    tiktok: {
        username: '', 
        maxReconnectAttempts: 3,
        reconnectDelay: 5000, 
        enabled: false 
    }
};