import { Activity, GuildMember, Message, MessageEmbed, Presence, TextChannel } from 'discord.js';
import { Command } from '../models/command';
import { getDao } from '../util/database';
import { argsToString, executeCommand, getCommand } from '../util/parsing';
import { StreamMessage } from '../models/stream-message';

const streamMessages: StreamMessage[] = [];

/**
 * Returns the streaming activity if one exists, otherwise, undefined
 * @param activities A list of Activity
 */
function getStreamingUpdate(activities: Activity[]): Activity | undefined {
    return activities.find(activity =>
        activity.type === 'STREAMING' &&
        activity.name === 'Twitch'
    );
}

export async function setStreamChannel(command: Command, args: string[], message: Message): Promise<void> {
    const channel = message.mentions.channels?.first();
    if (channel) {
        if (channel.type === 'text' && message.guild) {
            await getDao().setStreamChannelId(message.guild, channel.id);
            await message.channel.send(`<#${channel.id}> set as stream notification channel`);
        } else {
            await message.channel.send('Must mention a valid server text channel');
        }
    } else {
        await getDao().setStreamChannelId(message.guild!, undefined);
        await message.channel.send('NorseBot\'s streaming notification channel has been unset');
    }
}

export async function setStreamRole(command: Command, args: string[], message: Message): Promise<void> {
    if (args.length) {
        const streamRole = message.mentions.roles?.first();

        if (streamRole) {
            await getDao().setStreamRoleId(message.guild!, streamRole.id);
            await message.channel.send(`Set Norse Bot's streamer role as <@&${streamRole.id}>`);
        } else {
            await message.channel.send(`Invalid mention. Must @ROLE. (Ex: ${getDao().getPrefix(message.guild!)}stream ${command.example})`);
        }
    } else {
        await getDao().setStreamRoleId(message.guild!, undefined);
        await message.channel.send('Norse Bot\'s streamer role has been unset');
    }
}

/**
 * Gets all newly started activities based on same activity type and name
 * @param oldActivities
 * @param newActivities
 */
function getStarted(oldActivities: Activity[] | undefined, newActivities: Activity[]): Activity[] {
    if (oldActivities) {
        return newActivities.filter(newActivity => !oldActivities.some(oldActivity =>
            newActivity.type === oldActivity.type && newActivity.name === oldActivity.name
        ));
    } else {
        return newActivities;
    }
}

/**
 * Gets all stopped activities based on difference in activity type and name
 * @param oldActivities
 * @param newActivities
 */
function getStopped(oldActivities: Activity[] | undefined, newActivities: Activity[]): Activity[] {
    if (oldActivities) {
        return oldActivities.filter(oldActivity => !newActivities.some(newActivity =>
            oldActivity.type === newActivity.type && oldActivity.name === newActivity.name
        ));
    } else {
        return [];
    }
}

function generateStreamingMessage(username: string, topic: string | null, streamName: string | null, url: string | null): string {
    return `${username} started streaming **${topic}** - "${streamName || 'Unnamed Broadcast'}"\n${url}`;
}

async function userStartedStreaming(guildUser: GuildMember, streamActivity: Activity, oldPresence: Presence | undefined, newPresence: Presence): Promise<void> {
    if (newPresence.guild) { // User is in a server
        const streamChannelId = getDao().getStreamChannelId(newPresence.guild);
        const streamRoleId = getDao().getStreamRoleId(newPresence.guild);

        if (streamChannelId && streamRoleId) { // Server is setup for stream notifications
            const streamChannelFromDao = newPresence.guild.channels.cache.get(streamChannelId) as TextChannel;
            if (streamChannelFromDao && guildUser.roles.cache.has(streamRoleId)) { // Notification channel is setup and user has streamer role
                const sentMessage = await streamChannelFromDao.send( // Create message without a ping
                    generateStreamingMessage(guildUser.user.username, streamActivity.state, streamActivity.details, streamActivity.url)
                );
                await sentMessage.edit( // Add direction mention
                    generateStreamingMessage(`<@!${guildUser.user.id}>`, streamActivity.state, streamActivity.details, streamActivity.url)
                );
                streamMessages.push({
                    message: sentMessage,
                    streamerId: guildUser.user.id,
                    streamName: streamActivity.details,
                    streamTopic: streamActivity.state,
                    streamUrl: streamActivity.url,
                });
            }
        }
    }
}

async function userStoppedStreaming(guildUser: GuildMember, streamActivity: Activity): Promise<void> {
    const removalQueue: StreamMessage[] = [];
    for (const streamMessage of streamMessages) {
        if (streamMessage.streamerId === guildUser.id) {
            const twitchName = streamActivity.url?.slice(streamActivity.url?.lastIndexOf('/') + 1);
            const streamOfflineEmbed = new MessageEmbed()
                .setColor('#ba2d2d')
                .setAuthor(twitchName, guildUser.user.displayAvatarURL())
                .setThumbnail(guildUser.user.displayAvatarURL())
                .setTitle('Stream Offline')
                .setDescription(`[twitch.tv/${twitchName}](${streamMessage.streamUrl})`)
                .setFooter(`Played ${streamMessage.streamTopic}`)
                .setTimestamp(new Date());
            await streamMessage.message.edit(`<@!${streamMessage.streamerId}> was online`, streamOfflineEmbed);
            removalQueue.push(streamMessage);
        }
    }
    removalQueue.forEach(message => streamMessages.splice(streamMessages.indexOf(message), 1));
}

/**
 * Hancdles updates in user presences (playing game, streaming, etc.)
 * @param oldPresence
 * @param newPresence
 */
export async function presenceUpdate(oldPresence: Presence | undefined, newPresence: Presence): Promise<void> {
    const guildUser = newPresence.guild?.members.cache.get(newPresence.userID);

    if (guildUser) {
        const startedActivities = getStarted(oldPresence?.activities, newPresence.activities);
        const stoppedActivities = getStopped(oldPresence?.activities, newPresence.activities);

        // Started streaming
        let streamActivity = getStreamingUpdate(startedActivities);
        if (streamActivity) {
            await userStartedStreaming(guildUser, streamActivity, oldPresence, newPresence);
        }

        // Stopped streaming
        streamActivity = getStreamingUpdate(stoppedActivities);
        if (streamActivity) {
            await userStoppedStreaming(guildUser, streamActivity);
        }
    }
}