import monk from 'monk';
import { logger } from './log';
import { Guild } from 'discord.js';
import messages from '../util/messages.json';
import { GuildMemory } from '../models/guild-memory';

if (!process.env.DB_LOGIN_URL) {
    logger.error({ message: 'Environment variable DB_LOGIN_URL not setup' });
    process.exit(1);
}

const db = monk(process.env.DB_LOGIN_URL);
const guilds = db.get('guilds');
export const logs = db.get('logs');

const inMemoryGuilds: { [id: string]: GuildMemory } = {};

export async function getPrefix(guild?: Guild | null): Promise<string> {
    if (guild) {
        if (inMemoryGuilds[guild.id]) {
            return inMemoryGuilds[guild.id].prefix;
        }

        const dbGuild: GuildMemory | undefined = await guilds.findOne({ id: guild.id });

        if (dbGuild) {
            inMemoryGuilds[guild.id] = dbGuild;
            return dbGuild.prefix;
        } else {
            const newGuild: GuildMemory = {
                id: guild.id,
                name: guild.name,
                owner: guild.owner?.displayName,
                prefix: messages.defaultPrefix
            };
            inMemoryGuilds[guild.id] = newGuild;
            await guilds.insert(newGuild);
        }
    }
    return messages.defaultPrefix;
}

export async function setPrefix(guild: Guild, prefix: string): Promise<void> {
    inMemoryGuilds[guild.id].prefix = prefix;
    await guilds.update({ id: guild.id }, { $set: { prefix: prefix } });
    logger.debug({ message: `${guild.name} updated prefix to ${prefix}` });
}

export async function closeConnection(): Promise<void> {
    await db.close();
    logger.debug({ message: 'Database connection closed' });
}
