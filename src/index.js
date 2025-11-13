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
        
        this.init();
    }

    async init() {
        await this.player.extractors.register(YouTubeExtractor, {});
        await sleep(1000);

        await this.player.extractors.register(SpotifyBridgeExtractor, {});
        await sleep(1000);

        await this.player.extractors.register(SoundCloudExtractor, {});
        await sleep(1000);

        const extractors = Array.from(this.player.extractors.store.keys());
        console.log(chalk.yellow('Extractors registered:\n' + extractors.join('\n')));
        await sleep(1000);

        this.loadCommands();
        await sleep(1000);

        this.overlayServer = new OverlayServer(this);

        this.loadEvents();
        await sleep(1000);

        await this.client.login(process.env.DISCORD_BOT_TOKEN);
        await sleep(1000);

        Logger.success(`Logged in as ${this.client.user.tag}`);
        Logger.success(`Bot is ready! Serving ${this.client.guilds.cache.size} server`);
        
        if (config.bot.activity.name) {
            this.client.user.setActivity(config.bot.activity.name, { 
                type: config.bot.activity.type 
            });
        }
        
        this.initTikTokBridge();
        this.overlayServer.start();
        await sleep(1000);
    }

    loadCommands() {
        const commandsPath = path.join(__dirname, 'commands');
        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

        for (const file of commandFiles) {
            const filePath = path.join(commandsPath, file);
            const command = require(filePath);
            this.commands.set(command.name, command);
        }
        
        Logger.success(`Loaded ${this.commands.size} commands`);
    }

    loadEvents() {
        const discordEvents = require('./events/discordEvents');
        discordEvents.registerEvents(this.client, this);
        
        Logger.success('Discord events registered');
    }

    async initTikTokBridge() {
        await sleep(1000);
        
        this.tiktokBridge = new TikTokBridge(this);
        await sleep(1000);
        
        await this.tiktokBridge.start();
        await sleep(1000);
    }
}

new MusicBot();