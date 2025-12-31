import { Logger } from "../../utils/logging.js";
import { Client } from "discord.js";
import { MusicBot } from "../../types/bot.js";
import { QueueRepeatMode } from "discord-player";

export default {
  registerPlayerEvents(client: Client, bot: MusicBot) {
    Logger.debug("Registering player events", "PlayerEvents");

    // Track start event - when a song starts playing
    bot.player.events.on("playerStart", (queue: any, track: any) => {
      Logger.debug(
        `Player started: ${track.title} in guild ${queue.guild.name}`,
        "PlayerEvents"
      );

      if (queue.metadata && !queue.metadata.author.id.startsWith("tiktok_")) {
        const embed = {
          color: 0x2f3136,
          author: {
            name: "Now Playing",
          },
          description: `[**${track.title}**](${
            track.url || "https://example.com"
          })`,
          fields: [
            {
              name: "Channel",
              value: track.author || "Unknown",
              inline: true,
            },
            {
              name: "Duration",
              value: track.duration || "Unknown",
              inline: true,
            },
            {
              name: "Requested by",
              value:
                track.requestedBy?.toString() ||
                queue.metadata.author.toString(),
              inline: true,
            },
          ],
          timestamp: new Date(),
          footer: {
            text: `Volume: ${queue.node.volume}% • Queue: ${queue.tracks.size} songs`,
          },
        };
        queue.metadata.reply({ embeds: [embed] });
      }

      // Update overlay
      if (bot.overlayServer) {
        Logger.info("Updating overlay with track start");
        bot.overlayServer.updateStatus(track, queue);
      }
    });

    bot.player.events.on("audioTrackAdd", (queue: any, track: any) => {
      Logger.debug(
        `Track added to queue: ${track.title} (${track.source})`,
        "PlayerEvents"
      );

      if (bot.overlayServer) {
        const currentTrack = queue.currentTrack;
        bot.overlayServer.updateStatus(currentTrack, queue);
      }
    });

    // Additional logging events
    bot.player.events.on("audioTrackAdd", (queue: any, track: any) => {
      Logger.info(
        `Track added: ${track.title} from: ${track.source || "unknown"}`
      );
    });

    bot.player.events.on("emptyChannel", (queue: any) => {
      Logger.debug(
        `Voice channel empty in guild ${queue.guild.name}`,
        "PlayerEvents"
      );
      Logger.info("Voice channel is empty");
    });

    bot.player.events.on("emptyQueue", (queue: any) => {
      Logger.debug(
        `Queue finished in guild ${queue.guild.name}`,
        "PlayerEvents"
      );

      // Auto-disable loop if active when queue is empty
      if (queue.repeatMode !== QueueRepeatMode.OFF) {
        queue.setRepeatMode(QueueRepeatMode.OFF);
        Logger.debug("Auto-disabled loop due to empty queue", "PlayerEvents");
      }

      if (queue.metadata) {
        const embed = {
          color: 0xffff00,
          title: "Queue Finished",
          description: "Queue finished! No more songs to play.",
          timestamp: new Date(),
          footer: {
            text: "Kunang-Kunang",
          },
        };
        queue.metadata.reply({ embeds: [embed] });
      }

      if (bot.overlayServer) {
        Logger.info("Updating overlay with queue finish");
        bot.overlayServer.updateStatus(null, queue);
      }

      Logger.info("Queue is empty");
    });
  },
};
