import monk from 'monk';
import { logger } from './log';
import { Client, Guild, Role } from 'discord.js';
import messages from '../util/messages.json';
import { GuildMemory } from '../models/guild-memory';

const db = monk(process.env.DB_LOGIN_URL || 'localhost');
const guilds = db.get('guilds');
export const logs = db.get('logs');

const inMemoryGuilds: { [id: string]: GuildMemory } = {};

export async function setNewGuildInMemory(guild: Guild): Promise<void> {
    const newGuild: GuildMemory = {
        id: guild.id,
        name: guild.name,
        owner: guild.owner?.displayName,
        prefix: messages.defaultPrefix
    };
    inMemoryGuilds[guild.id] = newGuild;
    await guilds.insert(newGuild);
}

export async function initializeMemory(bot: Client): Promise<void> {
    const dbGuildsList: GuildMemory[] = await guilds.find();
    bot.guilds.cache.forEach(guild => {
        const dbGuild = dbGuildsList.find(dbGuild => dbGuild.id === guild.id);
        if (dbGuild) {
            inMemoryGuilds[guild.id] = dbGuild;
        } else {
            setNewGuildInMemory(guild);
        }
    });
}

export function getPrefix(guild?: Guild | null): string {
    if (guild && inMemoryGuilds[guild.id]) {
        return inMemoryGuilds[guild.id].prefix;
    }
    return messages.defaultPrefix;
}

export async function setPrefix(guild: Guild, prefix: string): Promise<void> {
    inMemoryGuilds[guild.id].prefix = prefix;
    await guilds.update({ id: guild.id }, { $set: { prefix: prefix } });
    logger.debug({ message: `${guild.name} prefix updated to ${prefix}` });
}

export function getAdminRoleId(guild?: Guild | null): string | undefined {
    if (guild) {
        return inMemoryGuilds[guild.id].adminRoleId;
    }
    return undefined;
}

export async function setGuildAdminRole(guild: Guild, role: Role): Promise<void> {
    inMemoryGuilds[guild.id].adminRoleId = role.id;
    await guilds.update({ id: guild.id }, { $set: { adminRoleId: role.id } });
    logger.debug({ message: `${guild.name} admin role updated to ${role.name}` });
}

export async function closeConnection(): Promise<void> {
    await db.close();
    logger.debug({ message: 'Database connection closed' });
}
