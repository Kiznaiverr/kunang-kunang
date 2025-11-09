const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { Player } = require('discord-player');
const { SoundCloudExtractor } = require('./extractors/SoundCloudExtractor');
const OverlayServer = require('./web/server');
const TikTokBridge = require('./utils/TikTokBridge');
const config = require('./config');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
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

    // Helper function for delay
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async init() {
        
        await this.player.extractors.register(SoundCloudExtractor, {});
        await this.delay(1000);

        const extractors = Array.from(this.player.extractors.store.keys());
        console.log(chalk.yellow('Extractors registered:\n' + extractors.join('\n')));
        await this.delay(1000);
        
        this.loadCommands();
        await this.delay(1000);
        
        // Create overlay server instance before events
        this.overlayServer = new OverlayServer(this);
        
        this.loadEvents();
        await this.delay(1000);
        
        await this.client.login(process.env.DISCORD_BOT_TOKEN);
        await this.delay(1000);
        
        // Bot is now ready
        console.log(chalk.green(`Logged in as ${this.client.user.tag}`));
        console.log(chalk.green(`Bot is ready! Serving ${this.client.guilds.cache.size} server`));
        
        if (config.bot.activity.name) {
            this.client.user.setActivity(config.bot.activity.name, { 
                type: config.bot.activity.type 
            });
        }
        
        this.initTikTokBridge();
        
        // Initialize overlay server after TikTok bridge
        this.overlayServer.start();
        await this.delay(1000);
    }

    loadCommands() {
        const commandsPath = path.join(__dirname, 'commands');
        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

        for (const file of commandFiles) {
            const filePath = path.join(commandsPath, file);
            const command = require(filePath);
            this.commands.set(command.name, command);
        }
        
        console.log(chalk.green(`Loaded ${this.commands.size} commands`));
    }

    loadEvents() {
        const discordEvents = require('./events/discordEvents');
        discordEvents.registerEvents(this.client, this);
        
        console.log(chalk.green('Discord events registered'));
    }

    async initTikTokBridge() {
        await this.delay(1000);
        
        this.tiktokBridge = new TikTokBridge(this);
        await this.delay(1000);
        
        await this.tiktokBridge.start();
        await this.delay(1000);
    }
}

new MusicBot();