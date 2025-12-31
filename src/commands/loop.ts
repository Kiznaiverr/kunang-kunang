import { useQueue, QueueRepeatMode } from "discord-player";
import { Message, EmbedBuilder } from "discord.js";
import { Logger } from "../utils/logging.js";
import { Command } from "../types/command.js";

const loopCommand: Command = {
  name: "loop",
  description: "Toggle loop for track or queue",
  execute: async (message: Message, args: string[], bot: any) => {
    Logger.command(`loop ${args.join(" ")}`, message.author.username);
    Logger.debug(
      `Loop command initiated by ${
        message.author.username
      } with args: [${args.join(", ")}]`,
      "LoopCommand"
    );

    if (!message.member?.voice.channel) {
      Logger.debug("User not in voice channel", "LoopCommand");
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle("Error")
        .setDescription("You need to be in a voice channel!")
        .setTimestamp()
        .setFooter({ text: "Kunang-Kunang" });
      return message.reply({ embeds: [embed] });
    }

    if (!message.guild) {
      Logger.debug("Message not in guild", "LoopCommand");
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle("Error")
        .setDescription("This command can only be used in a server!")
        .setTimestamp()
        .setFooter({ text: "Kunang-Kunang" });
      return message.reply({ embeds: [embed] });
    }

    const queue = useQueue(message.guild.id);

    if (!queue || !queue.node.isPlaying()) {
      Logger.debug("No active queue or not playing", "LoopCommand");
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle("Error")
        .setDescription("No music is currently playing!")
        .setTimestamp()
        .setFooter({ text: "Kunang-Kunang" });
      return message.reply({ embeds: [embed] });
    }

    const isQueueLoop = args.length > 0 && args[0].toLowerCase() === "queue";
    let warningMessage = "";

    if (isQueueLoop) {
      // Toggle queue loop
      if (queue.repeatMode === QueueRepeatMode.QUEUE) {
        // Already queue loop, turn off
        queue.setRepeatMode(QueueRepeatMode.OFF);
        Logger.debug("Queue loop disabled", "LoopCommand");
        const embed = new EmbedBuilder()
          .setColor(0x00ff00)
          .setTitle("Loop Disabled")
          .setDescription("Queue loop has been turned off.")
          .setTimestamp()
          .setFooter({ text: "Kunang-Kunang" });
        return message.reply({ embeds: [embed] });
      } else {
        // Enable queue loop, disable track loop if active
        if (queue.repeatMode === QueueRepeatMode.TRACK) {
          warningMessage = "Track loop was active and has been disabled.";
        }
        queue.setRepeatMode(QueueRepeatMode.QUEUE);
        Logger.debug("Queue loop enabled", "LoopCommand");
        const embed = new EmbedBuilder()
          .setColor(0x00ff00)
          .setTitle("Queue Loop Enabled")
          .setDescription(
            `The entire queue will now repeat.${
              warningMessage ? `\n\n⚠️ ${warningMessage}` : ""
            }`
          )
          .setTimestamp()
          .setFooter({ text: "Kunang-Kunang" });
        return message.reply({ embeds: [embed] });
      }
    } else {
      // Toggle track loop
      if (queue.repeatMode === QueueRepeatMode.TRACK) {
        // Already track loop, turn off
        queue.setRepeatMode(QueueRepeatMode.OFF);
        Logger.debug("Track loop disabled", "LoopCommand");
        const embed = new EmbedBuilder()
          .setColor(0x00ff00)
          .setTitle("Loop Disabled")
          .setDescription("Track loop has been turned off.")
          .setTimestamp()
          .setFooter({ text: "Kunang-Kunang" });
        return message.reply({ embeds: [embed] });
      } else {
        // Enable track loop, disable queue loop if active
        if (queue.repeatMode === QueueRepeatMode.QUEUE) {
          warningMessage = "Queue loop was active and has been disabled.";
        }
        queue.setRepeatMode(QueueRepeatMode.TRACK);
        Logger.debug("Track loop enabled", "LoopCommand");
        const embed = new EmbedBuilder()
          .setColor(0x00ff00)
          .setTitle("Track Loop Enabled")
          .setDescription(
            `The current track will now repeat.${
              warningMessage ? `\n\n⚠️ ${warningMessage}` : ""
            }`
          )
          .setTimestamp()
          .setFooter({ text: "Kunang-Kunang" });
        return message.reply({ embeds: [embed] });
      }
    }
  },
};

export default loopCommand;
