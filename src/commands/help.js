import fs from 'fs';
import path from 'path';
import { Logger } from '../utils/logging.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default {
    name: 'help',
    aliases: ['h', 'commands'],
    description: 'Show all available commands',
    execute: async (message, args, bot) => {
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
                    Logger.warn(`Could not load command from ${file}: ${error.message}`);
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
                            commandText += ` (Aliases: ${cmd.aliases.map(alias => `\`${alias}\``).join(', ')})`;
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
                        commandText += ` (Aliases: ${cmd.aliases.map(alias => `\`${alias}\``).join(', ')})`;
                    }
                    return commandText;
                }).join('\n');
                
                fields.push({
                    name: 'Other Commands',
                    value: commandList,
                    inline: false
                });
            }
            
            const embed = {
                color: 0x0099ff,
                title: '🎵 Kunang-Kunang Music Bot Commands',
                description: `Here are all the available commands for the music bot:\n\n**Total Commands:** ${commands.length}`,
                fields: fields,
                thumbnail: {
                    url: 'https://via.placeholder.com/150x150.png?text=🎵'
                },
                timestamp: new Date(),
                footer: {
                    text: `Prefix: ${bot.prefix} | Use ${bot.prefix}help for command list`
                }
            };

            return message.reply({ embeds: [embed] });
            
        } catch (error) {
            Logger.debug(`Help command failed: ${error.message}`, 'HelpCommand');
            Logger.error(`Error in help command: ${error.message}`);
            console.error(error);
            
            const embed = {
                color: 0xff0000,
                title: 'Help Command Error',
                description: 'There was an error loading the dynamic help. Please check contact the developer',
                timestamp: new Date(),
                footer: {
                    text: `Prefix: ${bot.prefix} | Kunang-Kunang Music Bot`
                }
            };
            
            return message.reply({ embeds: [embed] });
        }
    }
};