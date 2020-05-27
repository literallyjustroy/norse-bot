import { Command } from '../models/command';
import { Message } from 'discord.js';
import { getDao } from '../util/database';

export async function setAdmin(command: Command, args: string[], message: Message): Promise<void> {
    if (args.length) {
        const adminRole = message.mentions.roles?.first();

        if (adminRole) {
            await getDao().setAdminRoleId(message.guild!, adminRole.id);
            await message.channel.send(`Set Norse Bot's admin role as <@&${adminRole.id}>`);
        } else {
            await message.channel.send(`Invalid mention. Must @ROLE. (Ex: ${getDao().getPrefix(message.guild!)}setadmin @Moderator)`);
        }
    } else {
        await getDao().setAdminRoleId(message.guild!, undefined);
        await message.channel.send('Norse Bot\'s admin role has been wiped');
    }
}