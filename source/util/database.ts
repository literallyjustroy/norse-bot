import { Collection, MongoClient, MongoError } from 'mongodb';

import { Client, Guild, Role } from 'discord.js';
import messages from '../util/messages.json';
import { GuildMemory } from '../models/guild-memory';

export class Dao {
    public client: MongoClient;
    private dbName: string;
    private readonly inMemoryGuilds: { [id: string]: GuildMemory };

    constructor() {
        if (process.env.DB_NAME && process.env.DB_LOGIN_URL) {
            this.dbName = process.env.DB_NAME;
            this.inMemoryGuilds = {};
            this.client = new MongoClient(process.env.DB_LOGIN_URL, { useUnifiedTopology: true });
            this.client.connect((err: MongoError) => {
                if (err) {
                    throw err;
                }
            });
        } else {
            console.error('Database variables not defined');
            process.exit(1);
        }
    }
    
    private getCollection(collectionName: string): Collection<any> {
        return this.client.db(this.dbName).collection(collectionName);
    }

    async log(info: any): Promise<void> {
        await this.getCollection('logs').insertOne(info);
    }

    async setNewGuildInMemory(guild: Guild): Promise<void> {
        const newGuild: GuildMemory = {
            id: guild.id,
            name: guild.name,
            owner: guild.owner?.displayName,
            prefix: messages.defaultPrefix
        };
        this.inMemoryGuilds[guild.id] = newGuild;
        await this.getCollection('guilds').insertOne(newGuild);
    }

    async newGuildJoined(guild: Guild): Promise<void> {
        const dbGuild: GuildMemory | null = await this.getCollection('guilds').findOne({ id: guild.id });
        if (dbGuild) { // Guild already exists in database
            this.inMemoryGuilds[guild.id] = dbGuild;
        } else { // Guild isn't already in database
            await this.setNewGuildInMemory(guild);
        }
    }

    async initializeMemory(bot: Client): Promise<void> {
        const dbGuildsList: GuildMemory[] = await this.getCollection('guilds').find({}).toArray();
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
        await this.getCollection('guilds').updateOne({ id: guild.id }, { $set: { prefix: prefix } });
    }

    getAdminRoleId(guild?: Guild | null): string | undefined {
        if (guild) {
            return this.inMemoryGuilds[guild.id].adminRoleId;
        }
        return undefined;
    }

    async setAdminRoleId(guild: Guild, roleId: string | undefined): Promise<void> {
        this.inMemoryGuilds[guild.id].adminRoleId = roleId;
        await this.getCollection('guilds').updateOne({ id: guild.id }, { $set: { adminRoleId: roleId } });
    }

    getStreamRoleId(guild?: Guild | null): string | undefined {
        if (guild) {
            return this.inMemoryGuilds[guild.id].streamRoleId;
        }
        return undefined;
    }

    async setStreamRoleId(guild: Guild, roleId: string | undefined): Promise<void> {
        this.inMemoryGuilds[guild.id].streamRoleId = roleId;
        await this.getCollection('guilds').updateOne({ id: guild.id }, { $set: { streamRoleId: roleId } });
    }

    getTicketLogId(guild: Guild): string | undefined {
        return this.inMemoryGuilds[guild.id].ticketLogId;
    }

    async setTicketLogId(guild: Guild, ticketLogId: string | undefined): Promise<void> {
        this.inMemoryGuilds[guild.id].ticketLogId = ticketLogId;
        await this.getCollection('guilds').updateOne({ id: guild.id }, { $set: { ticketLogId: ticketLogId } });
    }

    getStreamChannelId(guild: Guild): string | undefined {
        return this.inMemoryGuilds[guild.id].streamChannelId;
    }

    async setStreamChannelId(guild: Guild, streamChannelId: string | undefined): Promise<void> {
        this.inMemoryGuilds[guild.id].streamChannelId = streamChannelId;
        await this.getCollection('guilds').updateOne({ id: guild.id }, { $set: { streamChannelId: streamChannelId } });
    }

    getApplyChannelId(guild: Guild): string | undefined {
        return this.inMemoryGuilds[guild.id].applyChannelId;
    }

    async setApplyChannelId(guild: Guild, applyChannelId: string | undefined): Promise<void> {
        this.inMemoryGuilds[guild.id].applyChannelId = applyChannelId;
        await this.getCollection('guilds').updateOne({ id: guild.id }, { $set: { applyChannelId: applyChannelId } });
    }

    getReviewChannelId(guild: Guild): string | undefined {
        return this.inMemoryGuilds[guild.id].reviewChannelId;
    }

    async setReviewChannelId(guild: Guild, reviewChannelId: string | undefined): Promise<void> {
        this.inMemoryGuilds[guild.id].reviewChannelId = reviewChannelId;
        await this.getCollection('guilds').updateOne({ id: guild.id }, { $set: { reviewChannelId: reviewChannelId } });
    }

    getApplyMessageId(guild: Guild): string | undefined {
        return this.inMemoryGuilds[guild.id].applyMessageId;
    }

    async setApplyMessageId(guild: Guild, applyMessageId: string | undefined): Promise<void> {
        this.inMemoryGuilds[guild.id].applyMessageId = applyMessageId;
        await this.getCollection('guilds').updateOne({ id: guild.id }, { $set: { applyMessageId: applyMessageId } });
    }

    async closeConnection(): Promise<void> {
        await this.client.close();
    }
}

let dao: Dao | undefined;

export function getDao(): Dao {
    if (!dao) {
        dao = new Dao();
    }
    return dao;
}