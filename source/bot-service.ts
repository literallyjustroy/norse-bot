import { Message } from 'discord.js';
import Misc from './functions';
import { ParsedMessage } from './models/parsed-message';
import { ticketHandler } from './tickets';
import { Command } from './models/command';

export async function ping(args: string[], message: Message): Promise<void> {
    await message.channel.send(Misc.ping(message.createdTimestamp));
}

export async function add(nums: number[], message: Message): Promise<void> {
    await message.channel.send(String(nums[0] + nums[1]));
}

export async function getImage(args: string[], message: Message): Promise<void> {
    await message.channel.send(Misc.randomImage(args));
}

export async function ticket(args: string[], message: Message): Promise<void> {
        await ticketHandler(args, message);
}

// Helper functions

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