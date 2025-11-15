<div align="center">

# Kunang-Kunang

### Discord Music Bot with TikTok Live Integration

*A Discord music bot built with TypeScript, discord.js v14 and discord-player v7.1.x, featuring TikTok live chat integration for cross-platform music control, real-time web overlay for streaming, and advanced logging system.*

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org)
[![Discord.js](https://img.shields.io/badge/Discord.js-v14-blue.svg)](https://discord.js.org)
[![Discord Player](https://img.shields.io/badge/Discord%20Player-v7.1.x-purple.svg)](https://discord-player.js.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-blue.svg)](https://www.typescriptlang.org)
[![TikTok Live Connector](https://img.shields.io/badge/TikTok%20Live%20Connector-2.1.0-orange.svg)](https://github.com/zerodytrash/TikTok-Live-Connector)

</div>

---

## Features

<table>
<tr>
<td>

**Music Player**
- High-quality audio playback
- Multiple music sources: SoundCloud, YouTube, Spotify
- Queue management
- Music controls (play, pause, skip, stop)
- Volume control and loop functionality
- Now playing with progress bar
- Auto-leave when idle

</td>
<td>

**TikTok Integration**  
- Real-time bridge between TikTok and Discord
- Cross-platform command execution
- Automatic reconnection
- Statistics tracking
- Manual bridge control

</td>
</tr>
<tr>
<td>

**Web Overlay**
- Real-time music display for streaming
- 4 different visual presets
- OBS browser source integration
- 400x80px transparent overlay
- Queue preview and status indicator

</td>
<td>

**Configuration**
- Centralized config system
- Environment variables
- Customizable settings
- Easy deployment
- Advanced logging

</td>
</tr>
</table>

## Quick Start

### Prerequisites

> **Required:** Node.js 18+, Discord Bot Token, SoundCloud API credentials  
> **Optional:** TikTok username for live integration  

### Installation

```bash
# Clone repository
git clone https://github.com/Kiznaiverr/kunang-kunang.git
cd kunang-kunang

# Install dependencies
npm install

# Build the project (TypeScript to JavaScript)
npm run build

# Start the bot
npm start

# For development (auto-restart on changes)
npm run dev
```

### Environment Setup

Create `.env` file in root directory:

```env
# Discord Configuration
DISCORD_BOT_TOKEN=your_discord_bot_token_here
DISCORD_CHANNEL_ID=your_channel_id_here
DISCORD_GUILD_ID=your_server_id_here  
DISCORD_VOICE_CHANNEL_ID=your_voice_channel_id_here
COMMAND_COOLDOWN=5000

# SoundCloud API credentials (Required)
SOUNDCLOUD_CLIENT_ID=your_soundcloud_client_id
SOUNDCLOUD_OAUTH_TOKEN=your_soundcloud_oauth_token

# TikTok API Key (Optional - Recommended to avoid rate limiting)
TIKTOK_SIGN_API_KEY=your_tiktok_api_key_here

# Logging Configuration (Optional)
LOG_LEVEL=info  # debug, info, success, warn, error, command, reply
```

<details>
<summary><strong>Getting TikTok Sign API Key (Optional - Recommended and its free)</strong></summary>

**Note**: TikTok Sign API key is optional but highly recommended to avoid rate limiting issues.

1. **Go to EulerStream website**
   - Visit [https://www.eulerstream.com/pricing](https://www.eulerstream.com/pricing)
   - Sign up for a free account

2. **Get your free API key**
   - After registration, you'll receive an API key
   - This key allows higher connection limits and prevents rate limiting

3. **Add to .env file**
   ```env
   TIKTOK_SIGN_API_KEY=your_api_key_here
   ```

**Benefits of using API key:**
- Higher connection limits
- No rate limiting issues
- More reliable TikTok bridge connections
- Better performance for frequent reconnections

</details>

<details>
<summary><strong>Getting SoundCloud API Credentials</strong></summary>

**Important**: SoundCloud API credentials are required for the bot to function properly.

1. **Go to SoundCloud and login**
   - Visit [soundcloud.com](https://soundcloud.com)
   - Login to your account (skip if already logged in)

2. **Open Developer Tools**
   - Right click anywhere on the page and select "Inspect"
   - Go to the "Network" tab in the developer tools

3. **Navigate and monitor requests**
   - Go to [soundcloud.com](https://soundcloud.com)
   - You should see requests appearing in the network tab

4. **Find the session request**
   - Look for a request named "session" (you can filter by typing "session" in the filter box)
   - Click on this request

5. **Extract your credentials**
   - Go to the "Payload" tab
   - Find your **Client ID** in the "Query String Parameters" section
   - Find your **OAuth token** (access_token) in the "Request Payload" section

6. **Add to .env file**
   ```env
   SOUNDCLOUD_CLIENT_ID=your_client_id_here
   SOUNDCLOUD_OAUTH_TOKEN=your_oauth_token_here
   ```

</details>

## Commands Reference

<details>
<summary><strong>Music Commands</strong></summary>

| Command | Aliases | Description |
|---------|---------|-------------|
| `!play <song>` | - | Play a song or add to queue |
| `!skip` | - | Skip current track |
| `!pause` | - | Pause current track |
| `!resume` | - | Resume paused track |
| `!stop` | - | Stop music and clear queue |
| `!queue` | `!q` | Show current queue |
| `!nowplaying` | `!np`, `!current` | Show currently playing track |
| `!volume <1-100>` | `!vol` | Set playback volume |

</details>

<details>
<summary><strong>TikTok Bridge Commands</strong></summary>

| Command | Aliases | Description |
|---------|---------|-------------|
| `!tiktok` | `!tt`, `!bridge` | Show TikTok bridge status |
| `!tiktok stats` | - | Show detailed statistics |
| `!tiktok disconnect` | - | Disconnect TikTok bridge |
| `!tiktok reconnect` | - | Reconnect TikTok bridge |

</details>

## Logging System

Kunang-Kunang features a comprehensive logging system for monitoring and debugging bot operations.

### Log Levels

| Level | Description | Use Case |
|-------|-------------|----------|
| `debug` | Detailed debugging information | Development and troubleshooting |
| `info` | General information | Normal operation monitoring |
| `success` | Successful operations | Confirming important actions |
| `warn` | Warning messages | Potential issues |
| `error` | Error messages | Failures and exceptions |
| `command` | Command executions | User command tracking |
| `reply` | Bot responses | Response monitoring |

### Configuration

Set the `LOG_LEVEL` environment variable to control verbosity:

```env
LOG_LEVEL=debug  # Show all log levels
LOG_LEVEL=info   # Show info, success, warn, error, command, reply
LOG_LEVEL=warn   # Show only warnings and errors
```

### Log Categories

The bot logs activities across multiple components:

- **Bot Initialization**: Startup sequence and component loading
- **Command Processing**: User commands and TikTok bridge commands  
- **Music Operations**: Playback, queue management, and streaming
- **Extractor Activities**: Music source detection and processing (YouTube, SoundCloud, Spotify)
- **Web Overlay**: Server operations and API requests
- **TikTok Integration**: Bridge connections and message processing
- **Error Handling**: Failures and recovery attempts

### Example Log Output

```
[15.26.56] [INFO] Logged in as BotName#0000
[15.26.57] [COMMAND] play - username
[15.26.58] [DEBUG] YouTubeExtractor: Processing YouTube URL...
[15.26.59] [SUCCESS] Connected to @tiktokuser
[15.27.00] [DEBUG] OverlayServer: NowPlaying API called - preset: 2
[15.27.01] [WARN] Queue is empty
[15.27.02] [ERROR] Failed to connect to TikTok
```

## TikTok Live Integration

### How it Works

1. **Connect to TikTok Live**: Bot connects to specified TikTok user's live stream
2. **Monitor Chat**: Listens for commands in TikTok live chat
3. **Execute Commands**: Processes commands and controls Discord music bot
4. **Cross-platform Control**: TikTok viewers can control Discord music

### Rate Limiting & API Key

**Important**: Without an API key, you may encounter rate limiting errors like:
```
Connection failed: [Rate Limited] (rate_limit_room_id_day) Too many connections started, try again later.
```

To avoid this, get a free API key from [EulerStream](https://www.eulerstream.com/pricing) and add it to your `.env` file as `TIKTOK_SIGN_API_KEY`.

### Supported Commands from TikTok

Any Discord music command can be used in TikTok live chat but cant displayed in TikTok live chat

### TikTok Bridge Features

- **Auto-reconnection** with failure handling
- **Statistics tracking** (commands processed, uptime)
- **Manual control** via Discord commands
- **Real-time monitoring** and status display
- **Error handling** and logging

## Web Overlay Integration

### Overview

Kunang-Kunang includes a built-in web overlay system for streamers, displaying real-time music information that can be captured in OBS using browser source.

### Features

- **Real-time Updates**: Live display of currently playing track
- **4 Visual Presets**: Different styles to match your stream aesthetic
- **Transparent Design**: Seamless integration with streaming software
- **Queue Preview**: Shows next tracks in queue
- **Fixed Size**: 400x80px optimized for streaming layouts

### Available Presets

| Preset | Style | Theme | Best For |
|--------|-------|--------|----------|
| 1 | Vinyl | Classic dark with circular album art | Retro/music streams |
| 2 | Crystal Glass | Modern transparent glassmorphism | Professional/clean streams |
| 3 | Minimal Line | Geometric with green accents | Gaming/tech streams |
| 4 | Neon Pulse | Cyberpunk with cyan/magenta glow | Tech/coding streams |

**Custom Overlay**

You can customize the overlay by creating your own design using the API endpoint at `/api/nowplaying`, which provides real-time music data:

```json
{
  "title": "Song Title",
  "author": "Artist Name",
  "thumbnail": "image_url",
  "duration": "3:45",
  "progress": 45000,
  "volume": 100,
  "isPlaying": true,
  "queue": [
    { "title": "Next Song 1", "author": "Artist 1" },
    { "title": "Next Song 2", "author": "Artist 2" }
  ]
}
```

### OBS Setup

1. **Add Browser Source in OBS**:
   - URL: `http://localhost:3000`
   - Width: `400`
   - Height: `80`
   - Check "Shutdown source when not visible"

2. **Configure preset in Configuration section below**

3. **Refresh browser source** and start playing music!

## Configuration

<details>
<summary><strong>Bot Settings (src/config.ts)</strong></summary>

```typescript
export default {
    // Bot behavior
    bot: {
        prefix: '!',                    // Command prefix
        activity: {
            name: 'Kunang-Kunang Music', // Bot activity text
            type: 2                     // Activity type (LISTENING)
        }
    },
    
    // Music player settings
    player: {
        maxQueueSize: 100,              // Maximum songs in queue        
        selfDeaf: true,                 // Bot deafens itself in voice channels
        volume: 100,                    // Default volume (0-100)
        quality: 'high',                // Audio quality: low, medium, high
        
        // Leave options for voice channel
        leaveOptions: {
            leaveOnEnd: true,          // Leave after queue finishes
            leaveOnEndCooldown: 300000,  // 5 minutes
            leaveOnEmpty: true,        // Leave when voice channel is empty
            leaveOnEmptyCooldown: 300000, // 5 minutes
            leaveOnStop: true,         // Leave when player is stopped
            leaveOnStopCooldown: 300000   // 5 minutes
        }
    },
    
    // TikTok integration settings
    tiktok: {
        username: '',                   // TikTok username for live integration
        maxReconnectAttempts: 3,        // Max reconnection attempts
        reconnectDelay: 5000,           // Delay between reconnection attempts (ms)
        enabled: false                  // Enable/disable TikTok integration
    },

    // Web overlay settings
    overlay: {
        enabled: true,                  // Enable/disable overlay server
        port: 3000,                    // Server port for overlay
        pollingInterval: 1000,          // Update frequency in ms
        maxQueueDisplay: 3,             // Number of queue items to display
        preset: 2                       // Visual preset: 1, 2, 3, or 4
    }
};
```

</details>

## Project Structure

```
src/
├── commands/
│   ├── play.ts
│   ├── queue.ts
│   ├── nowplaying.ts
│   ├── skip.ts
│   ├── pause.ts
│   ├── resume.ts
│   ├── stop.ts
│   ├── volume.ts
│   ├── shuffle.ts
│   ├── leave.ts
│   ├── help.ts
│   └── tiktok-stats.ts
├── events/
│   ├── discord/
│   │   ├── index.ts
│   │   ├── clientEvents.ts
│   │   ├── playerEvents.ts
│   │   └── errorEvents.ts
│   └── discordEvents.ts
├── extractors/
│   ├── index.ts
│   ├── SoundCloudExtractor.ts
│   ├── YouTubeExtractor.ts
│   └── SpotifyBridgeExtractor.ts
├── utils/
│   ├── logging.ts
│   ├── helpers.ts
│   ├── copy-overlay.ts
│   └── TikTokBridge.ts
├── web/
│   ├── server.ts
│   └── overlay/
│       ├── index.html
│       ├── css/
│       │   ├── preset1.css
│       │   ├── preset2.css
│       │   ├── preset3.css
│       │   └── preset4.css
│       └── js/
│           └── overlay.js
├── types/
│   ├── bot.ts
│   ├── command.ts
│   ├── discord.ts
│   └── tiktok.ts
├── config.ts
└── index.ts
```

## Development

### Adding New Commands

1. Create command file in `src/commands/`
2. Follow existing command structure:

```typescript
import { Message } from 'discord.js';
import { Command } from '../types/command.js';

const commandName: Command = {
    name: 'commandname',
    aliases: ['alias1', 'alias2'],
    description: 'Command description',
    execute: async (message: Message, args: string[], bot: any): Promise<any> => {
        // Command logic here
    }
};

export default commandName;
```

### Custom Music Sources

1. Create extractor in `src/extractors/`
2. Add export to `src/extractors/index.ts`:

```typescript
import { YourExtractor } from './YourExtractor.js';

export {
    // ... existing exports
    YourExtractor
};
```

3. Register in `src/index.ts`:

```typescript
import { YourExtractor } from './extractors/index.js';
await this.player.extractors.register(YourExtractor, {});
```

### Event Handling

Add event handlers in `src/events/discordEvents.ts`:

```typescript
bot.player.events.on('eventName', (queue, data) => {
    // Handle event
});
```

## TODO

### Planned Features

- [x] **Advanced logging system** with 7 configurable verbosity levels
- [x] **Comprehensive debug logging** across all components
- [x] **Sending message when a command is triggered from TikTok**
- [x] **Add other music platforms (YouTube, Spotify)**
- [x] **Enhanced error handling and recovery**
- [ ] **Make TikTok chat assistant**
- [ ] **Add playlist support for all platforms**
- [ ] **Create web dashboard for bot management**

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## Support

For support and questions:
- Create an issue on GitHub
- Check existing documentation
- I also speak Indonesian, so don't hesitate to make an issue or ask questions in Indonesian.

---

<div align="center">


**Kunang-Kunang bot music - adioss**

</div>