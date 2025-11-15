import { Client, GatewayIntentBits, Collection } from 'discord.js';
import { Player } from 'discord-player';
import { SoundCloudExtractor, YouTubeExtractor, SpotifyBridgeExtractor } from './extractors/index.js';
import OverlayServer from './web/server.js';
import TikTokBridge from './utils/TikTokBridge.js';
import config from './config.js';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { Logger } from './utils/logging.js';
import { sleep } from './utils/helpers.js';
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';
import { MusicBot as IMusicBot } from './types/bot.js';
import { Command } from './types/command.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

dotenv.config();

class MusicBot implements IMusicBot {
    client: Client;
    player: Player;
    commands: Collection<string, Command>;
    prefix: string;
    tiktokBridge: TikTokBridge | null;
    overlayServer: OverlayServer | null;

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

        this.player = new Player(this.client as any);

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
        await this.loadCommands();
        await sleep(1000);

        Logger.debug('MusicBot: Starting overlay server...');
        this.overlayServer = new OverlayServer(this);

        Logger.debug('MusicBot: Loading events...');
        await this.loadEvents();
        await sleep(1000);

        Logger.debug('MusicBot: Logging into Discord...');
        await this.client.login(process.env.DISCORD_BOT_TOKEN);
        await sleep(1000);

        Logger.success(`Logged in as ${this.client.user?.tag}`);
        Logger.success(`Bot is ready! Serving ${this.client.guilds.cache.size} server`);
        Logger.debug(`MusicBot: Bot ready - serving ${this.client.guilds.cache.size} guilds`);
        
        if (config.bot.activity.name && this.client.user) {
            Logger.debug(`MusicBot: Setting bot activity to "${config.bot.activity.name}" with type ${config.bot.activity.type}`);
            this.client.user.setActivity(config.bot.activity.name, { 
                type: config.bot.activity.type 
            });
        }
        
        Logger.debug('MusicBot: Initializing TikTok bridge...');
        await this.initTikTokBridge();
        
        Logger.debug('MusicBot: Starting overlay server...');
        this.overlayServer.start();
        await sleep(1000);
        
        Logger.debug('MusicBot: Initialization complete');
    }

    async loadCommands() {
        const commandsPath = path.join(__dirname, 'commands');
        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

        Logger.debug(`MusicBot: Found ${commandFiles.length} command files in ${commandsPath}`);
        
        for (const file of commandFiles) {
            const filePath = path.join(commandsPath, file);
            const commandModule = await import(pathToFileURL(filePath).href);
            const command = commandModule.default;
            this.commands.set(command.name, command);
            Logger.debug(`MusicBot: Loaded command "${command.name}" from ${file}`);
        }
        
        Logger.success(`Loaded ${this.commands.size} commands`);
        Logger.debug(`MusicBot: Command loading complete - ${this.commands.size} commands registered`);
    }

    async loadEvents() {
        Logger.debug('MusicBot: Registering Discord events...');
        const discordEventsModule = await import('./events/discordEvents.js');
        const discordEvents = discordEventsModule.default;
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