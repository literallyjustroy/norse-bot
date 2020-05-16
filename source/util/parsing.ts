import { ParsedMessage } from '../models/parsed-message';
import { Command } from '../models/command';
import { Message } from 'discord.js';
import { validateArgs } from './validator';
import messages from './messages.json';

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

export function argsToString(args: string[]): string {
    return args.slice(1, args.length + 1).join(' ');
}

export function generateValidationMessage(command?: Command): string {
    if (command) {
        if (command.validation) {
            return `${command.validation.message} (Ex: ${command.example})`;
        }
        return `Invalid usage of ${command.name} (Ex: ${command.example})`;
    } else {
        return 'Invalid usage of command';
    }
}

export function getCommand(inputCommand: string, commands: { [key: string]: Command }): Command {
    return commands[inputCommand] || Object.values(commands).find((cmd: Command) =>
        cmd.aliases && cmd.aliases.includes(inputCommand)
    );
}

export async function executeCommand(command: Command, args: string[], message: Message): Promise<void> {
    if (command && command.execute) {
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
        await message.channel.send(messages.unknownMessage);
    }
}