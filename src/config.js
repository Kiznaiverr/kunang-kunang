module.exports = {
    bot: {
        prefix: '!',
        activity: {
            name: 'Kunang-Kunang Music',
            type: 2 // 0: PLAYING, 1: STREAMING, 2: LISTENING, 3: WATCHING, 5: COMPETING
        }
    },
    
    player: {
        maxQueueSize: 100,
        selfDeaf: true, 
        volume: 100, 
        quality: 'high',  
        
        leaveOptions: {
            leaveOnEnd: true,        
            leaveOnEndCooldown: 300000, 
            leaveOnEmpty: true, 
            leaveOnEmptyCooldown: 300000,
            leaveOnStop: true,      
            leaveOnStopCooldown: 300000 
        }
    },
    
    tiktok: {
        username: '', 
        maxReconnectAttempts: 3,
        reconnectDelay: 5000, 
        enabled: false 
    },

    overlay: {
        enabled: true,
        port: 3000,
        pollingInterval: 1000, 
        maxQueueDisplay: 3,     
        preset: 2
    }
};