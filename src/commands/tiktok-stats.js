const config = require('../config');
const { Logger } = require('../utils/logging');

async function showStatus(message, bot) {
    const bridge = bot.tiktokBridge;
    const stats = bridge.getStats();
    
    Logger.debug(`TikTok showStatus: Displaying bridge status - Connected: ${stats.isConnected}, Username: ${stats.username || 'Not configured'}`);
    const embed = {
        color: stats.isConnected ? 0x00ff00 : 0xff0000,
        author: {
            name: 'TikTok Bridge Status'
        },
        fields: [
            {
                name: 'Connection Status',
                value: stats.isConnected ? '🟢 Connected' : '🔴 Disconnected',
                inline: true
            },
            {
                name: 'Target User',
                value: stats.username ? `@${stats.username}` : 'Not configured',
                inline: true
            },
            {
                name: 'Commands Available',
                value: `\`${config.bot.prefix}tiktok stats\` - Detailed statistics\n\`${config.bot.prefix}tiktok disconnect\` - Disconnect bridge\n\`${config.bot.prefix}tiktok reconnect\` - Reconnect bridge`,
                inline: false
            }
        ],
        timestamp: new Date(),
        footer: {
            text: 'TikTok Live Bridge'
        }
    };
    
    return message.reply({ embeds: [embed] });
}

async function showStats(message, bot) {
    const bridge = bot.tiktokBridge;
    const stats = bridge.getStats();
    
    Logger.debug(`TikTok showStats: Displaying detailed statistics - Commands: ${stats.commandsProcessed}, Messages: ${stats.messagesReceived}`);
    // Format uptime
    const uptimeMs = stats.uptime;
    const uptimeStr = formatUptime(uptimeMs);
    
    // Format last activity
    const lastActivityStr = stats.lastActivity 
        ? formatRelativeTime(stats.lastActivity)
        : 'No activity';
    
    const embed = {
        color: stats.isConnected ? 0x00ff00 : 0xff0000,
        author: {
            name: 'TikTok Bridge Statistics'
        },
        fields: [
            {
                name: 'Connection Info',
                value: `**Status:** ${stats.isConnected ? '🟢 Connected' : '🔴 Disconnected'}\n**Target:** @${stats.username || 'Not configured'}\n**Uptime:** ${uptimeStr}`,
                inline: true
            },
            {
                name: 'Activity Stats',
                value: `**Commands Processed:** ${stats.commandsProcessed}\n**Messages Received:** ${stats.messagesReceived}\n**Last Activity:** ${lastActivityStr}`,
                inline: true
            },
            {
                name: 'Configuration',
                value: `**Guild ID:** ${bridge.config.targetGuildId || 'Not set'}\n**Channel ID:** ${bridge.config.targetChannelId || 'Not set'}\n**Prefix:** \`${bridge.config.prefix}\``,
                inline: false
            }
        ],
        timestamp: new Date(),
        footer: {
            text: 'Statistics since last connection'
        }
    };
    
    if (stats.connectTime) {
        embed.fields.push({
            name: 'Connected Since',
            value: stats.connectTime.toLocaleString(),
            inline: true
        });
    }
    
    return message.reply({ embeds: [embed] });
}

async function disconnectBridge(message, bot) {
    const bridge = bot.tiktokBridge;
    
    if (!bridge.isConnected) {
        Logger.debug(`TikTok disconnectBridge: Bridge already disconnected for user ${message.author.username}`);
        const embed = {
            color: 0xffaa00,
            description: '**TikTok Bridge is already disconnected!**',
            timestamp: new Date()
        };
        return message.reply({ embeds: [embed] });
    }
    
    bridge.disconnect();
    
    Logger.debug(`TikTok disconnectBridge: Bridge manually disconnected by user ${message.author.username}`);
    const embed = {
        color: 0xff0000,
        author: {
            name: 'TikTok Bridge Disconnected'
        },
        description: 'TikTok Bridge has been manually disconnected.',
        timestamp: new Date()
    };
    
    return message.reply({ embeds: [embed] });
}

async function reconnectBridge(message, bot) {
    const bridge = bot.tiktokBridge;
    
    if (bridge.isConnected) {
        Logger.debug(`TikTok reconnectBridge: Bridge already connected for user ${message.author.username}`);
        const embed = {
            color: 0xffaa00,
            description: '**TikTok Bridge is already connected!**',
            timestamp: new Date()
        };
        return message.reply({ embeds: [embed] });
    }
    
    const embed = {
        color: 0xffaa00,
        description: '**Attempting to reconnect TikTok Bridge...**',
        timestamp: new Date()
    };
    
    const replyMessage = await message.reply({ embeds: [embed] });
    
    const success = await bridge.start();
    
    Logger.debug(`TikTok reconnectBridge: Reconnection attempt ${success ? 'successful' : 'failed'} for user ${message.author.username}`);
    const resultEmbed = {
        color: success ? 0x00ff00 : 0xff0000,
        author: {
            name: success ? 'Reconnection Successful' : 'Reconnection Failed'
        },
        description: success 
            ? 'TikTok Bridge has been reconnected successfully!'
            : 'Failed to reconnect TikTok Bridge. Check logs for details.',
        timestamp: new Date()
    };
    
    return replyMessage.edit({ embeds: [resultEmbed] });
}

function formatUptime(ms) {
    if (!ms || ms <= 0) return 'Not connected';
    
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
}

function formatRelativeTime(date) {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

module.exports = {
    name: 'tiktok',
    aliases: ['tt', 'bridge'],
    description: 'Show TikTok Bridge status and statistics',
    execute: async (message, args, bot) => {
        Logger.command(`tiktok ${args.join(' ')}`, message.author.username);
        const subcommand = args[0]?.toLowerCase();
        
        if (!bot.tiktokBridge) {
            Logger.debug(`TikTok command: TikTok Bridge not available for user ${message.author.username}`);
            const embed = {
                color: 0xff0000,
                title: 'TikTok Bridge Not Available',
                description: 'TikTok Bridge is not initialized or configured.',
                timestamp: new Date()
            };
            return message.reply({ embeds: [embed] });
        }
        
        // Validasi subcommand
        const validSubcommands = ['stats', 'status', 'disconnect', 'reconnect'];
        if (!subcommand || !validSubcommands.includes(subcommand)) {
            Logger.debug(`TikTok command: Invalid or missing subcommand '${subcommand}' for user ${message.author.username}`);
            const embed = {
                color: 0xffaa00,
                title: 'Invalid TikTok Command',
                description: `**Command tidak valid!**\n\nGunakan salah satu subcommand berikut:`,
                fields: [
                    {
                        name: 'Status & Statistics',
                        value: `\`${config.bot.prefix}tiktok status\` - Tampilkan status bridge\n\`${config.bot.prefix}tiktok stats\` - Tampilkan statistik detail`,
                        inline: false
                    },
                    {
                        name: 'Connection Management',
                        value: `\`${config.bot.prefix}tiktok disconnect\` - Putuskan koneksi bridge\n\`${config.bot.prefix}tiktok reconnect\` - Sambungkan ulang bridge`,
                        inline: false
                    }
                ],
                timestamp: new Date(),
                footer: {
                    text: `Contoh: ${config.bot.prefix}tiktok status`
                }
            };
            return message.reply({ embeds: [embed] });
        }
        
        switch (subcommand) {
            case 'stats':
            case 'status':
                Logger.debug(`TikTok command: Executing stats/status subcommand for user ${message.author.username}`);
                await showStats(message, bot);
                break;
                
            case 'disconnect':
                Logger.debug(`TikTok command: Executing disconnect subcommand for user ${message.author.username}`);
                await disconnectBridge(message, bot);
                break;
                
            case 'reconnect':
                Logger.debug(`TikTok command: Executing reconnect subcommand for user ${message.author.username}`);
                await reconnectBridge(message, bot);
                break;
        }
    }
};