import { ParsedMessage } from '../models/parsed-message';
import { Command } from '../models/command';
import { Channel, Guild, GuildMember, Message } from 'discord.js';
import { validateArgs } from './validator';
import messages from './messages.json';
import { getDao } from './database';

export function parseMessage(content: string, keywordString: string): ParsedMessage {
    let args = content.slice(keywordString.length).split(/ +/);
    let cmd = args.shift();
    if (cmd) {
        cmd = cmd.toLowerCase();
    } else {
        cmd = '';
    }
    args = args.filter((arg: string) => {
        return arg.trim().length !== 0;
    });

    return { cmd: cmd, args: args };
}

export function stringToName(input: string): string {
    return input.toLowerCase().replace(/[^a-zA-Z0-9]/g, '');
}

export function argsToString(args: string[]): string {
    return args.slice(1, args.length + 1).join(' ');
}

export function generateValidationMessage(command?: Command, message?: Message): string {
    if (command) {
        if (command.validation) {
            return `${command.validation.message} (Ex: ${getDao().getPrefix((message ? message.guild : null))}${command.example})`;
        }
        return `Invalid usage of ${command.name} (Ex: ${getDao().getPrefix((message ? message.guild : null))}${command.example})`;
    } else {
        return 'Invalid usage of command';
    }
}

export function getChannelFromArg(arg: string, guild: Guild): Channel | undefined  {
    const matches = arg.match(/^<#?(\d+)>$/);
    if (matches) {
        return guild.channels.cache.get(matches[1]);
    }
    return undefined;
}

export function getCommand(inputCommand: string, commands: { [key: string]: Command }): Command {
    return commands[inputCommand] || Object.values(commands).find((cmd: Command) =>
        cmd.aliases && cmd.aliases.includes(inputCommand)
    );
}

function hasPermission(command: Command, message: Message): boolean {
    if (command.permission) {
        if (message.guild) {
            const user = message.guild.members.cache.get(message.author.id);
            const adminRole = getDao().getAdminRoleId(message.guild);
            if (user && (user.hasPermission('ADMINISTRATOR') || (command.permission < 3 && adminRole && user.roles.cache.has(adminRole)))) {
                return true;
            }
        }
        return false;
    } else {
        return true;
    }
}

export async function executeCommand(command: Command, args: string[], message: Message): Promise<void> {
    if (command && command.execute) {
        if (!command.channelType || (command.channelType === 'server' && message.guild)) {
            if (hasPermission(command, message)) {
                if (command.validation) {
                    const validArgs = validateArgs(args, command.validation.type, command.validation.min, command.validation.max);
                    if (validArgs) {
                        await command.execute(command, validArgs, message);
                    } else {
                        await message.channel.send(generateValidationMessage(command));
                    }
                } else {
                    await command.execute(command, args, message);
                }
            } else {
                await message.channel.send(messages.permissionMessage);
            }
        } else {
            await message.channel.send(messages.serverCommandType);
        }
    } else if (message.channel.type === 'dm'){
        await message.channel.send(`${messages.unknownMessage} (Try ${getDao().getPrefix(message.guild)}help)`);
    }
}