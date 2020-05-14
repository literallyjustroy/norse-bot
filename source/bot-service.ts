import { validateArgs, Validator } from './util/validator';
import { Message } from 'discord.js';
import { ping, randomImage } from './functions';
import { ParsedMessage } from './models/parsed-message';
import { ticketHandler } from './tickets';

export class BotService {

    async ping(message: Message): Promise<void> {
        await message.channel.send(ping(message.createdTimestamp));
    }

    async add(args: string[], message: Message): Promise<void> {
        let response: string;
        const nums = validateArgs(args, Validator.NUMBER, 2) as number[];
        if (nums) {
            response = String(nums[0] + nums[1]);
        } else {
            response = 'Must add 2 numbers (Ex: "!add 1 2")';
        }
        await message.channel.send(response);
    }

    async getImage(args: string[], message: Message): Promise<void> {
        let response: string;
        const validArgs = validateArgs(args, Validator.ANY, 1) as string[];
        if (validArgs) {
            response = response = await randomImage(validArgs);
        } else {
            response = 'Must provide at least 1 search term (Ex: !get nku e-Sports)';
        }
        await message.channel.send(response);
    }

    async ticket(args: string[], message: Message): Promise<void> {
        const validArgs = validateArgs(args, Validator.ANY, 1) as string[];
        if (validArgs) {
            await ticketHandler(validArgs, message);
        } else {
            await message.channel.send('Must provide at least one sub-command (Ex: !ticket create NAME or !ticket close)');
        }
    }
}

export function parseMessage(content: string, keywordString: string): ParsedMessage {
    let args = content.substring(keywordString.length).split(' ');
    args = args.filter((arg: string) => {
        return arg.trim().length !== 0;
    });

    return { cmd: args[0], args: args.splice(1) };
}

export function argsToString(args: string[]): string {
    return args.slice(1, args.length + 1).join(' ');
}