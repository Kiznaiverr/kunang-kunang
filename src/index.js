const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { Player } = require('discord-player');
const { SoundCloudExtractor, YouTubeExtractor, SpotifyBridgeExtractor } = require('./extractors');
const OverlayServer = require('./web/server');
const TikTokBridge = require('./utils/TikTokBridge');
const config = require('./config');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const { Logger } = require('./utils/logging');
const { sleep } = require('./utils/helpers');
require('dotenv').config();

class MusicBot {
    constructor() {
        Logger.debug('MusicBot: Initializing Discord client and player...');
        
        this.client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.GuildVoiceStates
            ]
        });

        this.player = new Player(this.client, {
            ytdlOptions: {
                quality: 'highestaudio',
                highWaterMark: 1 << 25
            },
            selfDeaf: config.player.selfDeaf,
            volume: config.player.volume
        });

        this.commands = new Collection();
        this.prefix = config.bot.prefix;
        this.tiktokBridge = null;
        this.overlayServer = null;
        
        Logger.debug(`MusicBot: Player configured with volume ${config.player.volume}, selfDeaf: ${config.player.selfDeaf}`);
        this.init();
    }

    async init() {
        Logger.debug('MusicBot: Starting initialization sequence...');
        
        Logger.debug('MusicBot: Registering YouTube extractor...');
        await this.player.extractors.register(YouTubeExtractor, {});
        await sleep(1000);

        Logger.debug('MusicBot: Registering Spotify extractor...');
        await this.player.extractors.register(SpotifyBridgeExtractor, {});
        await sleep(1000);

        Logger.debug('MusicBot: Registering SoundCloud extractor...');
        await this.player.extractors.register(SoundCloudExtractor, {});
        await sleep(1000);

        const extractors = Array.from(this.player.extractors.store.keys());
        console.log(chalk.yellow('Extractors registered:\n' + extractors.join('\n')));
        Logger.debug(`MusicBot: Extractor registration complete - ${extractors.length} extractors loaded`);
        await sleep(1000);

        Logger.debug('MusicBot: Loading commands...');
        this.loadCommands();
        await sleep(1000);

        Logger.debug('MusicBot: Starting overlay server...');
        this.overlayServer = new OverlayServer(this);

        Logger.debug('MusicBot: Loading events...');
        this.loadEvents();
        await sleep(1000);

        Logger.debug('MusicBot: Logging into Discord...');
        await this.client.login(process.env.DISCORD_BOT_TOKEN);
        await sleep(1000);

        Logger.success(`Logged in as ${this.client.user.tag}`);
        Logger.success(`Bot is ready! Serving ${this.client.guilds.cache.size} server`);
        Logger.debug(`MusicBot: Bot ready - serving ${this.client.guilds.cache.size} guilds`);
        
        if (config.bot.activity.name) {
            Logger.debug(`MusicBot: Setting bot activity to "${config.bot.activity.name}" with type ${config.bot.activity.type}`);
            this.client.user.setActivity(config.bot.activity.name, { 
                type: config.bot.activity.type 
            });
        }
        
        Logger.debug('MusicBot: Initializing TikTok bridge...');
        this.initTikTokBridge();
        
        Logger.debug('MusicBot: Starting overlay server...');
        this.overlayServer.start();
        await sleep(1000);
        
        Logger.debug('MusicBot: Initialization complete');
    }

    loadCommands() {
        const commandsPath = path.join(__dirname, 'commands');
        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

        Logger.debug(`MusicBot: Found ${commandFiles.length} command files in ${commandsPath}`);
        
        for (const file of commandFiles) {
            const filePath = path.join(commandsPath, file);
            const command = require(filePath);
            this.commands.set(command.name, command);
            Logger.debug(`MusicBot: Loaded command "${command.name}" from ${file}`);
        }
        
        Logger.success(`Loaded ${this.commands.size} commands`);
        Logger.debug(`MusicBot: Command loading complete - ${this.commands.size} commands registered`);
    }

    loadEvents() {
        Logger.debug('MusicBot: Registering Discord events...');
        const discordEvents = require('./events/discordEvents');
        discordEvents.registerEvents(this.client, this);
        
        Logger.success('Discord events registered');
        Logger.debug('MusicBot: Discord events registration complete');
    }

    async initTikTokBridge() {
        await sleep(1000);
        
        Logger.debug('MusicBot: Creating TikTokBridge instance...');
        this.tiktokBridge = new TikTokBridge(this);
        await sleep(1000);
        
        Logger.debug('MusicBot: Starting TikTok bridge connection...');
        await this.tiktokBridge.start();
        await sleep(1000);
        
        Logger.debug('MusicBot: TikTok bridge initialization complete');
    }
}

new MusicBot();