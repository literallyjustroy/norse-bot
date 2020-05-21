import { Command } from '../models/command';
import { Message } from 'discord.js';
import { getDao } from '../util/database';

export async function updatePrefix(command: Command, args: string[], message: Message): Promise<void> {
    if(message.guild) {
        await getDao().setPrefix(message.guild, args[0]);
        await message.channel.send(`${message.guild.name} prefix updated to ${args[0]}`);
    } else {
        await message.channel.send('Prefix\'s can only be set in Server text channels');
    }
}