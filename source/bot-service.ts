import { Message } from 'discord.js';
import { closeTicket, createTicket, ticketHandler } from './commands/tickets';
import { getPing, randomImage } from './commands/misc';
import { Command } from './models/command';

export async function ping(command: Command, args: string[], message: Message): Promise<void> {
    await message.channel.send(getPing(message.createdTimestamp));
}

export async function add(command: Command, nums: number[], message: Message): Promise<void> {
    await message.channel.send(String(nums[0] + nums[1]));
}

export async function getImage(command: Command, args: string[], message: Message): Promise<void> {
    await message.channel.send(randomImage(args));
}

export async function ticket(command: Command, args: string[], message: Message): Promise<void> {
    await ticketHandler(command, args, message);
}

export async function ticketCreate(command: Command, args: string[], message: Message): Promise<void> {
    await createTicket(command, args, message);
}

export async function ticketClose(command: Command, args: string[], message: Message): Promise<void> {
    await closeTicket(command, args, message);
}