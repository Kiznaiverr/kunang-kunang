const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { Player } = require('discord-player');
const { AttachmentExtractor } = require('@discord-player/extractor');
const { SoundCloudExtractor } = require('./extractors/SoundCloudExtractor');
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
        
        this.init();
    }

    async init() {
        // Load attachment extractor for local file support
        await this.player.extractors.register(AttachmentExtractor, {});
        
        // Load custom extractor from extractor folder
        await this.player.extractors.register(SoundCloudExtractor, {});
        
        this.loadCommands();
        this.loadEvents();
        
        await this.client.login(process.env.DISCORD_BOT_TOKEN);
        
        // Initialize TikTok bridge after bot is ready
        this.client.once('clientReady', () => {
            if (config.bot.activity.name) {
                this.client.user.setActivity(config.bot.activity.name, { 
                    type: config.bot.activity.type 
                });
            }
            
            this.initTikTokBridge();
        });
    }

    loadCommands() {
        const commandsPath = path.join(__dirname, 'commands');
        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

        for (const file of commandFiles) {
            const filePath = path.join(commandsPath, file);
            const command = require(filePath);
            this.commands.set(command.name, command);
        }
    }

    loadEvents() {
        const discordEvents = require('./events/discordEvents');
        discordEvents.registerEvents(this.client, this);
    }

    async initTikTokBridge() {
        console.log(chalk.blue('Initializing TikTok Bridge...'));
        this.tiktokBridge = new TikTokBridge(this);
        await this.tiktokBridge.start();
    }
}

new MusicBot();