import fetch from 'node-fetch';
import { Command } from '../models/command';
import { Message } from 'discord.js';
import { sendError } from '../util/util';

/**
 * Calculates how long it took for a user's message to reach the bot (starting from when the user sent the message)
 * User PC -> Discord's Servers -> NorseBot
 * @param sentTime
 */
export function getPing(sentTime: number): string {
    return String(Math.abs(Date.now().valueOf() - sentTime)) + ' ms';
}

export async function getImage(command: Command, args: string[], message: Message): Promise<void> {
    if (process.env.UNSPLASH_TOKEN) {
        const keyword = encodeURI(args.join(' '));
        const url = `https://api.unsplash.com/photos/random/?query=${keyword}&client_id=${process.env.UNSPLASH_TOKEN}`;

        try {
            const response = await fetch(url);
            const jsonResponse = await response.json();
            if (jsonResponse.urls?.regular) {
                await message.channel.send(jsonResponse.urls.regular);
            } else {
                await sendError(message.channel, 'No results found');
            }
        } catch (error) {
            await sendError(message.channel, 'Error getting requested image (Might have hit image limit)');
        }
    } else {
        await sendError(message.channel, 'This command isn\'t setup yet. (Must set UNSPLASH_TOKEN environment variable)');
    }
}

export async function add(command: Command, nums: number[], message: Message): Promise<void> {
    await message.channel.send(String(nums[0] + nums[1]));
}

export async function ping(command: Command, args: string[], message: Message): Promise<void> {
    await message.channel.send(getPing(message.createdTimestamp));
}