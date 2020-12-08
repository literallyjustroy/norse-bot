import { Command } from '../models/command';
import { Message, TextChannel } from 'discord.js';
import { getChannelFromArg } from '../util/parsing';
import { isNewsChannel, isTextChannel } from '../util/util';

export async function say(command: Command, args: string[], message: Message): Promise<void> {
    const channel = getChannelFromArg(args[0], message.guild!);
    if (channel && (isTextChannel(channel) || isNewsChannel(channel))) {
        await channel.send(message.content.substring(message.content.indexOf(args[0]) + args[0].length));
    } else {
        await message.channel.send(`"${args[0]}" is not a valid text channel`);
    }
}
