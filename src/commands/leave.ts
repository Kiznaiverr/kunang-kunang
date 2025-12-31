import { useQueue, QueueRepeatMode } from "discord-player";
import { Message, EmbedBuilder } from "discord.js";
import { Logger } from "../utils/logging.js";
import { Command } from "../types/command.js";

const leaveCommand: Command = {
  name: "leave",
  description: "Leave the voice channel",
  execute: async (message: Message, args: string[], bot: any) => {
    Logger.command("leave", message.author.username);
    Logger.debug(
      `Leave command initiated by ${message.author.username} in guild ${message.guild?.name}`,
      "LeaveCommand"
    );

    if (!message.member?.voice.channel) {
      Logger.debug("User not in voice channel", "LeaveCommand");
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle("Error")
        .setDescription("You need to be in a voice channel!")
        .setTimestamp()
        .setFooter({ text: "Music Player" });
      return message.reply({ embeds: [embed] });
    }

    if (!message.guild) {
      Logger.debug("Message not in guild", "LeaveCommand");
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle("Error")
        .setDescription("This command can only be used in a server!")
        .setTimestamp()
        .setFooter({ text: "Music Player" });
      return message.reply({ embeds: [embed] });
    }

    if (!message.guild.members.me?.voice.channel) {
      Logger.debug("Bot is not in any voice channel", "LeaveCommand");
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle("Error")
        .setDescription("I am not in a voice channel!")
        .setTimestamp()
        .setFooter({ text: "Music Player" });
      return message.reply({ embeds: [embed] });
    }

    if (
      message.member?.voice.channel.id !==
      message.guild.members.me?.voice.channelId
    ) {
      Logger.debug("User not in same voice channel as bot", "LeaveCommand");
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle("Error")
        .setDescription("You need to be in the same voice channel as me!")
        .setTimestamp()
        .setFooter({ text: "Music Player" });
      return message.reply({ embeds: [embed] });
    }

    try {
      const queue = useQueue(message.guild.id);

      if (queue) {
        // Disable loop before leaving
        if (queue.repeatMode !== QueueRepeatMode.OFF) {
          queue.setRepeatMode(QueueRepeatMode.OFF);
          Logger.debug("Disabled loop before leaving", "LeaveCommand");
        }
        Logger.debug("Deleting queue", "LeaveCommand");
        queue.delete();
      }

      Logger.debug("Disconnecting from voice channel", "LeaveCommand");
      await message.guild.members.me?.voice.disconnect();
      const embed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle("Left Voice Channel")
        .setDescription("Left the voice channel and cleared the queue!")
        .addFields({
          name: "Disconnected by",
          value: message.author.toString(),
          inline: true,
        })
        .setTimestamp()
        .setFooter({ text: "Music Player" });
      return message.reply({ embeds: [embed] });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      Logger.debug(`Leave command failed: ${errorMsg}`, "LeaveCommand");
      Logger.error(`Leave command error: ${errorMsg}`);
      console.error(error);
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle("Error")
        .setDescription("Error occurred while leaving the voice channel!")
        .setTimestamp()
        .setFooter({ text: "Music Player" });
      return message.reply({ embeds: [embed] });
    }
  },
};

export default leaveCommand;
