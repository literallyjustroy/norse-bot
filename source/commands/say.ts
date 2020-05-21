import { Command } from '../models/command';
import { Message, TextChannel } from 'discord.js';
import { getChannelFromArg } from '../util/parsing';

export async function say(command: Command, args: string[], message: Message): Promise<void> {
    if (message.guild) {
        const channel = getChannelFromArg(args[0], message.guild);
        if (channel && (channel.type === 'text' || channel.type === 'news')) {
            await (channel as TextChannel).send(message.content.substring(message.content.indexOf(args[0]) + args[0].length));
        } else {
            await message.channel.send(`"${args[0]}" is not a valid text channel`);
        }
    } else {
        await message.channel.send('Can only speak in Server Text channels');
    }
}