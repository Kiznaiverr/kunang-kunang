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

        Logger.debug(`TikTokBridge: Initialized with username: ${this.config.username}, enabled: ${this.config.enabled}`);
    }

    /**
     * Start the TikTok bridge connection
     */
    async start() {
        if (!this.config.enabled) {
            Logger.debug('TikTokBridge: Bridge is disabled in configuration, skipping start');
            Logger.warn('TikTok bridge is disabled in configuration');
            return false;
        }

        if (!this.validateConfiguration()) {
            Logger.debug('TikTokBridge: Configuration validation failed');
            return false;
        }

        Logger.info(`Connecting to @${this.config.username}...`);
        Logger.debug(`TikTokBridge: Starting connection to @${this.config.username}`);
        
        try {
            await this.initializeConnection();
            Logger.debug('TikTokBridge: Connection initialization successful');
            return true;
        } catch (error) {
            Logger.error(`Connection failed: ${error.message}`);
            Logger.debug(`TikTokBridge: Connection initialization failed - ${error.message}`);
            await this.handleConnectionFailure(error);
            return false;
        }
    }

    /**
     * Validate required configuration
     */
    validateConfiguration() {
        Logger.debug('TikTokBridge: Validating configuration...');
        
        if (!this.config.username) {
            Logger.debug('TikTokBridge: Username validation failed - not configured');
            Logger.warn('Username not configured in environment variables');
            return false;
        }

        if (!this.config.targetGuildId) {
            Logger.debug('TikTokBridge: Guild ID validation failed - not configured');
            Logger.warn('Discord Guild ID not configured');
            return false;
        }

        if (!this.config.targetChannelId) {
            Logger.debug('TikTokBridge: Channel ID validation failed - not configured');
            Logger.warn('Discord Voice Channel ID not configured');
            return false;
        }

        Logger.debug('TikTokBridge: Configuration validation passed');
        return true;
    }

    /**
     * Initialize WebcastPushConnection and set up event handlers
     */
    async initializeConnection() {
        Logger.debug(`TikTokBridge: Creating WebcastPushConnection for @${this.config.username}`);
        this.connection = new WebcastPushConnection(this.config.username);
        this.setupEventHandlers();
        Logger.debug('TikTokBridge: Attempting to connect...');
        await this.connection.connect();
    }

    /**
     * Set up all event handlers for the TikTok connection
     */
    setupEventHandlers() {
        Logger.debug('TikTokBridge: Setting up event handlers');
        this.connection.on('connected', () => this.handleConnected());
        this.connection.on('disconnected', () => this.handleDisconnected());
        this.connection.on('error', (error) => this.handleError(error));
        this.connection.on('chat', (data) => this.handleChatMessage(data));
        this.connection.on('member', (data) => this.handleMemberJoin(data));
        this.connection.on('like', (data) => this.handleLike(data));
        Logger.debug('TikTokBridge: Event handlers registered');
    }

    /**
     * Handle successful connection
     */
    handleConnected() {
        Logger.success(`Connected to @${this.config.username}`);
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.stats.connectTime = new Date();
        Logger.debug(`TikTokBridge: Connection established, reset reconnect attempts to 0`);
    }

    /**
     * Handle disconnection
     */
    handleDisconnected() {
        Logger.warn(`Disconnected from @${this.config.username}`);
        this.isConnected = false;
        this.stats.connectTime = null;
        Logger.debug('TikTokBridge: Connection lost, cleared connect time');
    }

    /**
     * Handle connection errors
     */
    handleError(error) {
        Logger.error(`Connection error: ${error.message}`);
        this.isConnected = false;
        Logger.debug(`TikTokBridge: Connection error occurred - ${error.message}`);
    }

    /**
     * Handle chat messages from TikTok
     */
    async handleChatMessage(data) {
        try {
            this.stats.messagesReceived++;
            this.stats.lastActivity = new Date();

            const { uniqueId: username, comment: message, user } = data;
            Logger.debug(`TikTokBridge: Received chat message from ${username}: "${message}"`);
            
            if (!this.isValidCommand(message)) {
                Logger.debug(`TikTokBridge: Message from ${username} is not a valid command`);
                return;
            }

            Logger.command(`${username} -> ${message}`);
            
            const { commandName, args } = this.parseCommand(message);
            Logger.debug(`TikTokBridge: Parsed command "${commandName}" with args [${args.join(', ')}]`);
            
            const command = this.getDiscordCommand(commandName);
            
            if (!command) {
                Logger.debug(`TikTokBridge: Command "${commandName}" not found in Discord bot`);
                Logger.warn(`Command '${commandName}' not found`);
                return;
            }

            // Check if user has permission to use this command
            if (!this.hasCommandPermission(username, commandName, user)) {
                Logger.debug(`TikTokBridge: User ${username} lacks permission for command "${commandName}"`);
                Logger.warn(`User ${username} does not have permission to use command '${commandName}'`);
                return;
            }

            Logger.debug(`TikTokBridge: Executing command "${commandName}" for user ${username}`);
            await this.executeCommand(command, username, message, args);
            this.stats.commandsProcessed++;
            Logger.debug(`TikTokBridge: Command "${commandName}" executed successfully, total processed: ${this.stats.commandsProcessed}`);
            
        } catch (error) {
            Logger.error(`Error handling chat message: ${error.message}`);
            Logger.debug(`TikTokBridge: Error in handleChatMessage - ${error.message}`);
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
            Logger.debug(`TikTokBridge: Command "${commandName}" is in allowed list for all users`);
            return true; // Everyone can use these commands
        }
        
        // Check if user is host or moderator
        const hasPermission = this.isPrivilegedUser(username, user);
        Logger.debug(`TikTokBridge: User ${username} privileged check: ${hasPermission}`);
        return hasPermission;
    }

    /**
     * Check if user is privileged (host or moderator from TikTok)
     */
    isPrivilegedUser(username, user) {
        // Host
        if (username === this.config.username) {
            Logger.debug(`TikTokBridge: User ${username} is host (privileged)`);
            return true;
        }
        
        // Moderator from TikTok data
        if (user && user.isModerator) {
            Logger.debug(`TikTokBridge: User ${username} is moderator (privileged)`);
            return true;
        }
        
        Logger.debug(`TikTokBridge: User ${username} is not privileged`);
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
        Logger.debug(`TikTokBridge: Created fake Discord message for ${username}`);
        
        try {
            await command.execute(fakeMessage, args, this.bot);
            Logger.debug(`TikTokBridge: Command "${command.name}" executed successfully for ${username}`);
        } catch (error) {
            Logger.error(`Error executing command '${command.name}': ${error.message}`);
            Logger.debug(`TikTokBridge: Command execution failed for ${username} - ${error.message}`);
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
            Logger.debug(`TikTokBridge: Target guild ${this.config.targetGuildId} not found in cache`);
            Logger.warn(`Target guild ${this.config.targetGuildId} not found`);
        } else {
            Logger.debug(`TikTokBridge: Found target guild "${guild.name}" (${this.config.targetGuildId})`);
        }
        return guild;
    }

    /**
     * Get target voice channel
     */
    getTargetVoiceChannel(guild) {
        if (!guild) {
            Logger.debug('TikTokBridge: Cannot get voice channel - guild is null');
            return null;
        }
        
        const channel = guild.channels.cache.get(this.config.targetChannelId);
        if (!channel) {
            Logger.debug(`TikTokBridge: Target voice channel ${this.config.targetChannelId} not found in guild "${guild.name}"`);
            Logger.warn(`Target voice channel ${this.config.targetChannelId} not found`);
        } else {
            Logger.debug(`TikTokBridge: Found target voice channel "${channel.name}" (${this.config.targetChannelId})`);
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
                    Logger.reply(`To ${username}: ${content}`);
                } else if (content.embeds && content.embeds[0]) {
                    const embed = content.embeds[0];
                    const title = embed.title || embed.author?.name || 'Response';
                    const description = embed.description || 'No description';
                    Logger.reply(`To ${username}: ${title} - ${description}`);
                } else {
                    Logger.reply(`To ${username}: [Complex response]`);
                }
            } catch (error) {
                Logger.error(`Error in reply handler: ${error.message}`);
            }
        };
    }

    /**
     * Handle connection failures and implement reconnection logic
     */
    async handleConnectionFailure(error) {
        Logger.debug(`TikTokBridge: Handling connection failure - current attempts: ${this.reconnectAttempts}/${this.config.maxReconnectAttempts}`);
        
        if (this.reconnectAttempts < this.config.maxReconnectAttempts) {
            this.reconnectAttempts++;
            Logger.info(`Reconnection attempt ${this.reconnectAttempts}/${this.config.maxReconnectAttempts} in ${this.config.reconnectDelay/1000}s...`);
            Logger.debug(`TikTokBridge: Scheduling reconnection attempt ${this.reconnectAttempts} in ${this.config.reconnectDelay}ms`);
            
            setTimeout(() => {
                this.start();
            }, this.config.reconnectDelay);
        } else {
            Logger.debug('TikTokBridge: Max reconnection attempts reached, bridge disabled');
            Logger.error('Max reconnection attempts reached. TikTok Bridge disabled.');
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
            Logger.debug('TikTokBridge: Disconnecting from TikTok live stream');
            this.connection.disconnect();
            this.connection = null;
            this.isConnected = false;
            this.stats.connectTime = null;
            Logger.info('TikTok Bridge disconnected');
            Logger.debug('TikTokBridge: Connection cleaned up and statistics reset');
        } else {
            Logger.debug('TikTokBridge: Disconnect called but no active connection');
        }
    }
}

module.exports = TikTokBridge;