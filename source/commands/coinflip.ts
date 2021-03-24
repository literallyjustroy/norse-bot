import { Command } from '../models/command';
import { Message } from 'discord.js';


export async function coinFlip(command: Command, args: string[], message: Message): Promise<void> {
    const coin = [
        'Heads',
        'Tails'
    ];

    message.channel.send(coin[Math.floor(Math.random()*coin.length)]);
}