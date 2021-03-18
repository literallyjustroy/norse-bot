import { Command } from '../models/command';
import { Message } from 'discord.js';


export async function eightBall(command: Command, args: string[], message: Message): Promise<void> {
    const responses = [
        'As I see it, yes.',
        'Ask again later.',
        'Better not tell you now.',
        'Cannot predict now.',
        'Concentrate and ask again.',
        'Don\'t count on it.',
        'It is certain.',
        'It is decidedly so.'
    ];

    message.channel.send(responses[Math.floor(Math.random()*responses.length)]);
}