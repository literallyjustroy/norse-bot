import { Command } from '../models/command';
import { Message } from 'discord.js';
import { dao } from '../util/database';

export async function setAdmin(command: Command, args: string[], message: Message): Promise<void> {
    if(message.guild) {
        const adminRole = message.mentions.roles?.first();

        if (adminRole) {
            await dao.setGuildAdminRole(message.guild, adminRole);
            await message.channel.send(`Set admin role as <@&${adminRole.id}>`);
        } else {
            await message.channel.send(`Invalid mention. Must @ROLE. (Ex: ${dao.getPrefix(message.guild)}setadmin @Moderator)`);
        }
    } else {
        await message.channel.send('Admin Role can only be set in Server text channels');
    }
}