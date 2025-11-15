import fs from 'fs';
import path from 'path';
import { Message, EmbedBuilder } from 'discord.js';
import { Logger } from '../utils/logging.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { Command } from '../types/command.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const helpCommand: Command = {
    name: 'help',
    aliases: ['h', 'commands'],
    description: 'Show all available commands',
    execute: async (message: Message, args: string[], bot: any) => {
        Logger.command('help', message.author.username);
        Logger.debug(`Help command initiated by ${message.author.username}`, 'HelpCommand');
        
        try {
            const commandsPath = path.join(__dirname);
            const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
            Logger.debug(`Found ${commandFiles.length} command files`, 'HelpCommand');
            
            const commands = [];
            
            for (const file of commandFiles) {
                try {
                    const commandModule = await import(path.join(commandsPath, file));
                    const command = commandModule.default;
                    if (command.name && command.description) {
                        commands.push({
                            name: command.name,
                            aliases: command.aliases || [],
                            description: command.description
                        });
                    }
                } catch (error) {
                    const errorMsg = error instanceof Error ? error.message : String(error);
                    Logger.warn(`Could not load command from ${file}: ${errorMsg}`);
                }
            }
            
            commands.sort((a, b) => a.name.localeCompare(b.name));
            
            const categories = {
                'Music Playback': ['play', 'pause', 'resume', 'skip', 'stop', 'leave'],
                'Queue Management': ['queue', 'shuffle', 'nowplaying'],
                'Audio Controls': ['volume'],
                'TikTok Integration': ['tiktok'],
                'Information': ['help']
            };
            
            const fields = [];
            
            for (const [categoryName, categoryCommands] of Object.entries(categories)) {
                const categoryCommandsInfo = commands.filter(cmd => categoryCommands.includes(cmd.name));
                
                if (categoryCommandsInfo.length > 0) {
                    const commandList = categoryCommandsInfo.map(cmd => {
                        let commandText = `\`${bot.prefix}${cmd.name}\` - ${cmd.description}`;
                        if (cmd.aliases && cmd.aliases.length > 0) {
                            commandText += ` (Aliases: ${cmd.aliases.map((alias: string) => `\`${alias}\``).join(', ')})`;
                        }
                        return commandText;
                    }).join('\n');
                    
                    fields.push({
                        name: categoryName,
                        value: commandList,
                        inline: false
                    });
                }
            }
            
            const categorizedCommandNames = Object.values(categories).flat();
            const uncategorizedCommands = commands.filter(cmd => !categorizedCommandNames.includes(cmd.name));
            
            if (uncategorizedCommands.length > 0) {
                const commandList = uncategorizedCommands.map(cmd => {
                    let commandText = `\`${bot.prefix}${cmd.name}\` - ${cmd.description}`;
                    if (cmd.aliases && cmd.aliases.length > 0) {
                        commandText += ` (Aliases: ${cmd.aliases.map((alias: string) => `\`${alias}\``).join(', ')})`;
                    }
                    return commandText;
                }).join('\n');
                
                fields.push({
                    name: 'Other Commands',
                    value: commandList,
                    inline: false
                });
            }
            
            const embed = new EmbedBuilder()
                .setColor(0x0099ff)
                .setTitle('🎵 Kunang-Kunang Music Bot Commands')
                .setDescription(`Here are all the available commands for the music bot:\n\n**Total Commands:** ${commands.length}`)
                .addFields(fields)
                .setThumbnail('https://via.placeholder.com/150x150.png?text=🎵')
                .setTimestamp()
                .setFooter({ text: `Prefix: ${bot.prefix} | Use ${bot.prefix}help for command list` });

            return message.reply({ embeds: [embed] });
            
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            Logger.debug(`Help command failed: ${errorMsg}`, 'HelpCommand');
            Logger.error(`Error in help command: ${errorMsg}`);
            console.error(error);
            
            const embed = new EmbedBuilder()
                .setColor(0xff0000)
                .setTitle('Help Command Error')
                .setDescription('There was an error loading the dynamic help. Please check contact the developer')
                .setTimestamp()
                .setFooter({ text: `Prefix: ${bot.prefix} | Kunang-Kunang Music Bot` });
            
            return message.reply({ embeds: [embed] });
        }
    }
};

export default helpCommand;