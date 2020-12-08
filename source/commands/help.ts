import { Command } from '../models/command';
import { Message, MessageEmbed } from 'discord.js';
import { commands } from '../commands';
import { getCommand } from '../util/parsing';
import { getDao } from '../util/database';
import messages from '../util/messages.json';
import { logger } from '../util/log';
import { isDMChannel } from '../util/util';

const BOT_AVATAR = 'https://cdn.discordapp.com/avatars/667552258476736512/c49cb419c5d3c8beb1f3e830341c21cd.png?size=512';

function commandsToKeyList(commands: { [key: string]: Command }): string[] {
     return Object.keys(commands);
}

function commandKeyToPrimaryKey(commandKey: string, commands: { [key: string]: Command }): string {
     const keyList = commandsToKeyList(commands);
     const primaryCommandKey = keyList.find(key => {
          const command = commands[key];
          return command.aliases && command.aliases.includes(commandKey);
     });
     if (primaryCommandKey) {
          return primaryCommandKey;
     }
     return commandKey;
}

function generateSingleHelpMessage(commandKey: string, command: Command, prefix: string): MessageEmbed {
     const helpMessage = new MessageEmbed()
         .setColor('#31449E')
         .setTitle(command.name)
         .setThumbnail(BOT_AVATAR)
         .setDescription(command.description)
         .setFooter(`Use "${prefix}help command" for more info on a command.`)
         .addField('Usage', prefix + commandKey);


     if (command.aliases && command.aliases.length) {
          helpMessage.addField('Aliases', command.aliases.join(', '), true);
     }

     helpMessage.addField('Example', prefix + command.example, true);

     if (command.subCommands) {
          helpMessage.addField('Sub-commands', `**${commandsToKeyList(command.subCommands).join(', ')}**`);
     }

     return helpMessage;
}

function getHelpMessageTemplate(): MessageEmbed {
     return new MessageEmbed().setColor('#31449E');
}

function generateHelpMessage(prefix: string): MessageEmbed[] {
     const keys: string[] = Object.keys(commands);
     let helpMessage = getHelpMessageTemplate()
         .setThumbnail(BOT_AVATAR)
         .setTitle('Commands');
     let index = 1;
     const embeds: MessageEmbed[] = [];

     keys.forEach(key => {
          if (index % 8 === 0) { // Limit to 7 commands per help embed (25 fields is maximum, 3 fields per command)
               embeds.push(helpMessage);
               helpMessage = getHelpMessageTemplate();
          }
          helpMessage.addField('Name', `**${commands[key].name}**`, true);
          helpMessage.addField('Usage', messages.defaultPrefix + key, true);
          helpMessage.addField('Description', commands[key].description, true);
          index += 1;
     });

     helpMessage.setFooter(`Use "${messages.defaultPrefix}help command" for more info on a command.`);
     embeds.push(helpMessage);

     return embeds;
}

export async function help(command: Command, args: string[], message: Message): Promise<void> {
     if (args.length) {
          let commandKey = args[0].toLowerCase();
          let commandForHelp = getCommand(commandKey, commands);
          if (args.length > 1 && commandForHelp && commandForHelp.subCommands) {
               commandKey = args[1].toLowerCase();
               commandForHelp = getCommand(commandKey, commandForHelp.subCommands);
          }
          if (commandForHelp) {
               await message.channel.send(generateSingleHelpMessage(commandKeyToPrimaryKey(commandKey, commands), commandForHelp, getDao().getPrefix(message.guild)));
          } else {
               await message.channel.send('Cannot provide help for unknown command');
          }
     } else { // Help with no arguments
          await message.react('💬');
          for (const embed of generateHelpMessage(getDao().getPrefix(message.guild))) {
               await message.author.send(embed);
          }
          if (isDMChannel(message.channel)) {
               const response = await message.channel.send('I messaged you the help documentation');
               try {
                    await response.delete({ timeout: 5000 });
               } catch {
                    logger.debug(messages.deleteError);
               }
          }
     }
}
