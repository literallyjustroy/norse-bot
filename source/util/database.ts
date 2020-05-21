import { MongoClient, MongoError } from 'mongodb';

import { Client, Guild, Role } from 'discord.js';
import messages from '../util/messages.json';
import { GuildMemory } from '../models/guild-memory';

export class Dao {
    public client: MongoClient;
    private dbName: string;
    private inMemoryGuilds: { [id: string]: GuildMemory };

    constructor() {
        if (process.env.DB_NAME && process.env.DB_LOGIN_URL) {
            this.client = new MongoClient(process.env.DB_LOGIN_URL, { useUnifiedTopology: true });
            this.client.connect((err: MongoError) => {
                if (err) {
                    throw err;
                }
            });
            this.dbName = process.env.DB_NAME;
            this.inMemoryGuilds = {};
        } else {
            console.error('Database variables not defined');
            process.exit(1);
        }
    }

    async setNewGuildInMemory(guild: Guild): Promise<void> {
        const newGuild: GuildMemory = {
            id: guild.id,
            name: guild.name,
            owner: guild.owner?.displayName,
            prefix: messages.defaultPrefix
        };
        this.inMemoryGuilds[guild.id] = newGuild;
        await this.client.db(this.dbName).collection('guilds').insertOne(newGuild);
    }

    async initializeMemory(bot: Client): Promise<void> {
        const dbGuildsList: GuildMemory[] = await this.client.db(this.dbName).collection('guilds').find({}).toArray();
        bot.guilds.cache.forEach(guild => {
            const dbGuild = dbGuildsList.find(dbGuild => dbGuild.id === guild.id);
            if (dbGuild) {
                this.inMemoryGuilds[guild.id] = dbGuild;
            } else {
                this.setNewGuildInMemory(guild);
            }
        });
    }

    getPrefix(guild?: Guild | null): string {
        if (guild && this.inMemoryGuilds[guild.id]) {
            return this.inMemoryGuilds[guild.id].prefix;
        }
        return messages.defaultPrefix;
    }

    async setPrefix(guild: Guild, prefix: string): Promise<void> {
        this.inMemoryGuilds[guild.id].prefix = prefix;
        await this.client.db(this.dbName).collection('guilds').updateOne({ id: guild.id }, { $set: { prefix: prefix } });
    }

    getAdminRoleId(guild?: Guild | null): string | undefined {
        if (guild) {
            return this.inMemoryGuilds[guild.id].adminRoleId;
        }
        return undefined;
    }

    async setGuildAdminRole(guild: Guild, role: Role): Promise<void> {
        this.inMemoryGuilds[guild.id].adminRoleId = role.id;
        await this.client.db(this.dbName).collection('guilds').updateOne({ id: guild.id }, { $set: { adminRoleId: role.id } });
    }

    async closeConnection(): Promise<void> {
        await this.client.close();
    }
}

let dao: Dao | undefined;

export function getDao(): Dao {
    if (dao) {
        return dao;
    } else {
        dao = new Dao();
        return dao;
    }
}