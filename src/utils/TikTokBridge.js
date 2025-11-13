const { WebcastPushConnection } = require('tiktok-live-connector');
const config = require('../config');
const { Logger } = require('./logging');

/**
 * TikTok Live Chat Bridge for Discord Bot
 * Connects to TikTok live streams and forwards commands to Discord bot
 */
class TikTokBridge {
    constructor(bot) {
        this.bot = bot;
        this.connection = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        
        // Configuration
        this.config = {
            username: config.tiktok.username,
            targetGuildId: process.env.DISCORD_GUILD_ID,
            targetChannelId: process.env.DISCORD_VOICE_CHANNEL_ID,
            prefix: config.bot.prefix,
            maxReconnectAttempts: config.tiktok.maxReconnectAttempts,
            reconnectDelay: config.tiktok.reconnectDelay,
            enabled: config.tiktok.enabled
        };
        
        // Statistics
        this.stats = {
            commandsProcessed: 0,
            messagesReceived: 0,
            connectTime: null,
            lastActivity: null
        };
    }

    /**
     * Start the TikTok bridge connection
     */
    async start() {
        if (!this.config.enabled) {
            Logger.log('info', 'TikTok bridge is disabled in configuration');
            return false;
        }

        if (!this.validateConfiguration()) {
            return false;
        }

        Logger.log('info', `Connecting to @${this.config.username}...`);
        
        try {
            await this.initializeConnection();
            return true;
        } catch (error) {
            Logger.log('error', `Connection failed: ${error.message}`);
            await this.handleConnectionFailure(error);
            return false;
        }
    }

    /**
     * Validate required configuration
     */
    validateConfiguration() {
        if (!this.config.username) {
            Logger.log('warn', 'Username not configured in environment variables');
            return false;
        }

        if (!this.config.targetGuildId) {
            Logger.log('warn', 'Discord Guild ID not configured');
            return false;
        }

        if (!this.config.targetChannelId) {
            Logger.log('warn', 'Discord Voice Channel ID not configured');
            return false;
        }

        return true;
    }

    /**
     * Initialize WebcastPushConnection and set up event handlers
     */
    async initializeConnection() {
        this.connection = new WebcastPushConnection(this.config.username);
        this.setupEventHandlers();
        await this.connection.connect();
    }

    /**
     * Set up all event handlers for the TikTok connection
     */
    setupEventHandlers() {
        this.connection.on('connected', () => this.handleConnected());
        this.connection.on('disconnected', () => this.handleDisconnected());
        this.connection.on('error', (error) => this.handleError(error));
        this.connection.on('chat', (data) => this.handleChatMessage(data));
        this.connection.on('member', (data) => this.handleMemberJoin(data));
        this.connection.on('like', (data) => this.handleLike(data));
    }

    /**
     * Handle successful connection
     */
    handleConnected() {
        Logger.log('success', `Connected to @${this.config.username}`);
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.stats.connectTime = new Date();
    }

    /**
     * Handle disconnection
     */
    handleDisconnected() {
        Logger.log('warn', `Disconnected from @${this.config.username}`);
        this.isConnected = false;
        this.stats.connectTime = null;
    }

    /**
     * Handle connection errors
     */
    handleError(error) {
        Logger.log('error', `Connection error: ${error.message}`);
        this.isConnected = false;
    }

    /**
     * Handle chat messages from TikTok
     */
    async handleChatMessage(data) {
        try {
            this.stats.messagesReceived++;
            this.stats.lastActivity = new Date();

            const { uniqueId: username, comment: message, user } = data;
            
            if (!this.isValidCommand(message)) {
                return;
            }

            Logger.log('command', `${username} -> ${message}`);
            
            const { commandName, args } = this.parseCommand(message);
            const command = this.getDiscordCommand(commandName);
            
            if (!command) {
                Logger.log('warn', `Command '${commandName}' not found`);
                return;
            }

            // Check if user has permission to use this command
            if (!this.hasCommandPermission(username, commandName, user)) {
                this.log('warn', `User ${username} does not have permission to use command '${commandName}'`);
                return;
            }

            await this.executeCommand(command, username, message, args);
            this.stats.commandsProcessed++;
            
        } catch (error) {
            Logger.log('error', `Error handling chat message: ${error.message}`);
        }
    }

    /**
     * Handle member join events (optional logging)
     */
    handleMemberJoin(data) {
        // Optional: Log when someone joins the TikTok live
        // log.log('info', `${data.uniqueId} joined the live`);
    }

    /**
     * Handle like events (optional logging)
     */
    handleLike(data) {
        // Optional: Log likes
        // log.log('info', `${data.uniqueId} liked the stream`);
    }

    /**
     * Check if message is a valid command
     */
    isValidCommand(message) {
        return message && typeof message === 'string' && message.startsWith(this.config.prefix);
    }

    /**
     * Parse command from message
     */
    parseCommand(message) {
        const args = message.slice(this.config.prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();
        return { commandName, args };
    }

    /**
     * Check if user has permission to use a command
     */
    hasCommandPermission(username, commandName, user) {
        const allowedCommands = ['play', 'help', 'nowplaying', 'queue'];
        
        if (allowedCommands.includes(commandName)) {
            return true; // Everyone can use these commands
        }
        
        // Check if user is host or moderator
        return this.isPrivilegedUser(username, user);
    }

    /**
     * Check if user is privileged (host or moderator from TikTok)
     */
    isPrivilegedUser(username, user) {
        // Host
        if (username === this.config.username) {
            return true;
        }
        
        // Moderator from TikTok data
        if (user && user.isModerator) {
            return true;
        }
        
        return false;
    }

    /**
     * Get Discord command by name
     */
    getDiscordCommand(commandName) {
        return this.bot.commands.get(commandName)
            || this.bot.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
    }

    /**
     * Execute Discord command with TikTok context
     */
    async executeCommand(command, username, message, args) {
        const fakeMessage = this.createDiscordMessage(username, message);
        
        try {
            await command.execute(fakeMessage, args, this.bot);
        } catch (error) {
            Logger.log('error', `Error executing command '${command.name}': ${error.message}`);
        }
    }

    /**
     * Create a fake Discord message object for TikTok commands
     */
    createDiscordMessage(username, message) {
        const guild = this.getTargetGuild();
        const voiceChannel = this.getTargetVoiceChannel(guild);

        return {
            content: message,
            author: this.createTikTokUser(username),
            guild: guild,
            member: this.createTikTokMember(voiceChannel)
        };
    }

    /**
     * Get target Discord guild
     */
    getTargetGuild() {
        const guild = this.bot.client.guilds.cache.get(this.config.targetGuildId);
        if (!guild) {
            Logger.log('warn', `Target guild ${this.config.targetGuildId} not found`);
        }
        return guild;
    }

    /**
     * Get target voice channel
     */
    getTargetVoiceChannel(guild) {
        if (!guild) return null;
        
        const channel = guild.channels.cache.get(this.config.targetChannelId);
        if (!channel) {
            Logger.log('warn', `Target voice channel ${this.config.targetChannelId} not found`);
        }
        return channel;
    }

    /**
     * Create TikTok user object
     */
    createTikTokUser(username) {
        return {
            id: `tiktok_${username}`,
            username: username,
            tag: `${username}#TikTok`,
            bot: false,
            toString: () => `@${username} (TikTok)`
        };
    }

    /**
     * Create TikTok member object
     */
    createTikTokMember(voiceChannel) {
        return {
            voice: {
                channel: voiceChannel,
                channelId: this.config.targetChannelId
            },
            permissions: {
                has: () => true // Grant permissions for TikTok commands
            },
            roles: {
                cache: new Map() // Empty roles
            }
        };
    }

    /**
     * Create reply handler for TikTok responses
     */
    createReplyHandler(username) {
        return async (content) => {
            try {
                if (typeof content === 'string') {
                    Logger.log('reply', `To ${username}: ${content}`);
                } else if (content.embeds && content.embeds[0]) {
                    const embed = content.embeds[0];
                    const title = embed.title || embed.author?.name || 'Response';
                    const description = embed.description || 'No description';
                    Logger.log('reply', `To ${username}: ${title} - ${description}`);
                } else {
                    Logger.log('reply', `To ${username}: [Complex response]`);
                }
            } catch (error) {
                Logger.log('error', `Error in reply handler: ${error.message}`);
            }
        };
    }

    /**
     * Handle connection failures and implement reconnection logic
     */
    async handleConnectionFailure(error) {
        if (this.reconnectAttempts < this.config.maxReconnectAttempts) {
            this.reconnectAttempts++;
            Logger.log('info', `Reconnection attempt ${this.reconnectAttempts}/${this.config.maxReconnectAttempts} in ${this.config.reconnectDelay/1000}s...`);
            
            setTimeout(() => {
                this.start();
            }, this.config.reconnectDelay);
        } else {
            Logger.log('error', 'Max reconnection attempts reached. TikTok Bridge disabled.');
        }
    }

    /**
     * Get bridge statistics
     */
    getStats() {
        return {
            ...this.stats,
            isConnected: this.isConnected,
            username: this.config.username,
            uptime: this.stats.connectTime ? Date.now() - this.stats.connectTime : 0
        };
    }

    /**
     * Disconnect from TikTok
     */
    disconnect() {
        if (this.connection) {
            this.connection.disconnect();
            this.connection = null;
            this.isConnected = false;
            this.stats.connectTime = null;
            Logger.log('info', 'TikTok Bridge disconnected');
        }
    }
}

module.exports = TikTokBridge;