<div align="center">

# Kunang-Kunang

### Discord Music Bot with TikTok Live Integration

*A Discord music bot built with discord.js v14 and discord-player v7.1.x, featuring TikTok live chat integration for cross-platform music control.*

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org)
[![Discord.js](https://img.shields.io/badge/Discord.js-v14-blue.svg)](https://discord.js.org)
[![Discord Player](https://img.shields.io/badge/Discord%20Player-v7.1.x-purple.svg)](https://discord-player.js.org)

</div>

---

## Features

<table>
<tr>
<td>

**Music Player**
- High-quality audio playback
- SoundCloud integration
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

# Start the bot
npm start
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
```

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

## TikTok Live Integration

### How it Works

1. **Connect to TikTok Live**: Bot connects to specified TikTok user's live stream
2. **Monitor Chat**: Listens for commands in TikTok live chat
3. **Execute Commands**: Processes commands and controls Discord music bot
4. **Cross-platform Control**: TikTok viewers can control Discord music

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

### OBS Setup

1. **Start the overlay server**:
   ```bash
   npm start           # Full bot with overlay
   npm run test-overlay # Overlay only for testing
   ```

2. **Add Browser Source in OBS**:
   - URL: `http://localhost:3000`
   - Width: `400`
   - Height: `80`
   - Check "Shutdown source when not visible"

3. **Configure preset in `src/config.js`**:
   ```javascript
   overlay: {
       enabled: true,
       preset: 2        // 1, 2, 3, or 4
   }
   ```

4. **Refresh browser source** and start playing music!

### Overlay Configuration

Edit `src/config.js` to customize overlay behavior:

```javascript
overlay: {
    enabled: true,              // Enable/disable overlay server
    port: 3000,                // Server port
    pollingInterval: 1000,      // Update frequency (ms)
    maxQueueDisplay: 3,         // Songs to show in queue
    preset: 2                   // Visual preset (1-4)
}
```

## Configuration

<details>
<summary><strong>Bot Settings (src/config.js)</strong></summary>

```javascript
module.exports = {
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
        defaultSearchEngine: 'soundcloud', // youtube, soundcloud, spotify
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
}
```

</details>

### Environment Variables (`.env`)

```env
# Discord Configuration (Required)
DISCORD_BOT_TOKEN=your_discord_bot_token_here
DISCORD_GUILD_ID=your_server_id_here
DISCORD_VOICE_CHANNEL_ID=your_voice_channel_id_here

# SoundCloud API credentials (Required)
SOUNDCLOUD_CLIENT_ID=your_soundcloud_client_id
SOUNDCLOUD_OAUTH_TOKEN=your_soundcloud_oauth_token
```

## Project Structure

```
src/
├── commands/
│   ├── play.js
│   ├── queue.js
│   ├── nowplaying.js
│   ├── skip.js
│   ├── pause.js
│   ├── resume.js
│   ├── stop.js
│   ├── volume.js
│   ├── shuffle.js
│   ├── leave.js
│   └── tiktok-stats.js
├── events/
│   ├── discord/
│   │   ├── index.js
│   │   ├── clientEvents.js
│   │   ├── playerEvents.js
│   │   └── errorEvents.js
│   └── discordEvents.js
├── extractors/
│   └── SoundCloudExtractor.js
├── utils/
│   └── TikTokBridge.js
├── web-overlay/
│   ├── server.js
│   └── public/
│       ├── index.html
│       ├── css/
│       │   ├── preset1.css
│       │   ├── preset2.css
│       │   ├── preset3.css
│       │   └── preset4.css
│       └── js/
│           └── overlay.js
├── config.js
└── index.js
```

## Development

### Adding New Commands

1. Create command file in `src/commands/`
2. Follow existing command structure:

```javascript
module.exports = {
    name: 'commandname',
    aliases: ['alias1', 'alias2'],
    description: 'Command description',
    execute: async (message, args, bot) => {
        // Command logic here
    }
};
```

### Custom Music Sources

1. Create extractor in `src/extractors/`
2. Register in `src/index.js`:

```javascript
await this.player.extractors.register(YourExtractor, {});
```

### Event Handling

Add event handlers in `src/events/discordEvents.js`:

```javascript
bot.player.events.on('eventName', (queue, data) => {
    // Handle event
});
```

## TODO

### Planned Features

- [ ] **Make TikTok chat assistant**

### Future Enhancements

- [ ] **Web dashboard** for bot management
- [ ] **Multi-server support** with separate configurations
- [ ] **User preferences** and personalized playlists
- [ ] **Advanced queue management** (shuffle, repeat modes)
- [ ] **Voice commands** integration
- [ ] **Lyrics display** for current tracks
- [ ] **Music recommendations** based on listening history

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## Support

For support and questions:
- Create an issue on GitHub
- Check existing documentation

---

<div align="center">

**Built with love by [Kiznaiverr](https://github.com/Kiznaiverr)**

*Kunang-Kunang - Bringing music communities together across platforms*

</div>