import { Command } from '../models/command';
import { Message } from 'discord.js';
import { getDao } from '../util/database';

export async function updatePrefix(command: Command, args: string[], message: Message): Promise<void> {
    await getDao().setPrefix(message.guild!, args[0]);
    await message.channel.send(`${message.guild!.name} prefix updated to ${args[0]}`);
}