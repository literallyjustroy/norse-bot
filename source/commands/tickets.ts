import {
    CategoryChannel,
    DMChannel,
    Guild,
    Message,
    MessageAttachment,
    MessageEmbed,
    NewsChannel,
    TextChannel
} from 'discord.js';
import { executeCommand, argsToString, generateValidationMessage, getCommand, stringToName } from '../util/parsing';
import { Command } from '../models/command';
import { capitalizeFirstLetter, isTextChannel } from '../util/util';
import { getDao } from '../util/database';
import { logger } from '../util/log';
import messages from '../util/messages.json';

const TICKET_CATEGORY_NAME = 'Tickets';
const TICKET_LOG_NAME = 'ticket-logs';
const TICKET_LOG_TOPIC_TEXT = 'Logs of every ticket closed';

async function getTicketsCategory(guild: Guild): Promise<CategoryChannel> {
    const ticketLogId = getDao().getTicketLogId(guild);
    if (ticketLogId) {
        const ticketLogChannel = guild.channels.cache.get(ticketLogId);
        if (ticketLogChannel && ticketLogChannel.parent) {
            return ticketLogChannel.parent;
        }
    }
    return await guild.channels.create(
        TICKET_CATEGORY_NAME,
        {
            type: 'category',
            permissionOverwrites: [
                {
                    id: guild.id,
                    deny: ['VIEW_CHANNEL'],
                }
            ]
        }
    );
}

async function createTicketTextChannel(ticketName: string, category: CategoryChannel | undefined, message: Message, guild: Guild): Promise<TextChannel> {
    const textChannel = await guild.channels.create(
            ticketName,
            {
                type: 'text',
                parent: category,
            }
    );
    await textChannel.lockPermissions(); // Sync with category permissions
    await textChannel.updateOverwrite(message.author.id, { VIEW_CHANNEL: true });
    return textChannel;
}

async function getTicketLogChannel(category: CategoryChannel, guild: Guild): Promise<TextChannel> {
    const ticketLogId = getDao().getTicketLogId(guild);
    if (ticketLogId) {
        const logChannelFromDao = guild.channels.cache.get(ticketLogId) as TextChannel;
        if (logChannelFromDao) {
            if (logChannelFromDao.parent !== category) {
                await logChannelFromDao.setParent(category);
            }
            return logChannelFromDao;
        }
    }
    const ticketLogChannel = await guild.channels.create(
        TICKET_LOG_NAME,
        {
            type: 'text',
            topic: TICKET_LOG_TOPIC_TEXT,
            position: 0,
            parent: category,
        }
    );
    await getDao().setTicketLogId(guild, ticketLogChannel.id);
    await ticketLogChannel.lockPermissions(); // Sync with category permissions
    return ticketLogChannel;
}

export async function createTicket(command: Command, args: string[], message: Message): Promise<void> {
    let ticketName: string;
    if (args[0]) {
        ticketName = args[0];
    } else {
        ticketName = message.author.username + '-unnamed';
    }
    const guild = message.guild as Guild;
    if (ticketName && ticketName.length && ticketName.length <= 100 && stringToName(ticketName) !== stringToName(TICKET_LOG_NAME)) {
        const category = await getTicketsCategory(guild);
        await getTicketLogChannel(category, guild);
        const ticketChannel = await createTicketTextChannel(ticketName, category, message, guild);

        const botResponse = await message.channel.send(`Ticket opened: <#${ticketChannel.id}>`);

        const ticketIntroMessage = new MessageEmbed()
            .setColor('#ffbf00')
            .setTitle(capitalizeFirstLetter(ticketName))
            .setAuthor(`${message.author.username}`, message.author.displayAvatarURL())
            .setDescription('Describe why you opened the ticket so that the responders can better assist you')
            .addFields(
                { name: 'Closing the ticket', value: `***${getDao().getPrefix(message.guild)}ticket close (optional reason)***` },
                { name: 'Adding another user', value: `***${getDao().getPrefix(message.guild)}ticket add @(username)***` },
            );

        await ticketChannel.send(`Ticket opened by <@!${message.author.id}>`, ticketIntroMessage);

        try {
            await botResponse.delete({ timeout: 15000 });
            await message.delete();
        } catch {
            logger.debug(messages.deleteError);
        }
    } else {
        await message.channel.send(generateValidationMessage(command));
    }
}

async function isTicketChannel(channel: TextChannel | DMChannel | NewsChannel): Promise<boolean> {
    if (!isTextChannel(channel))
        return false;
    const ticketLogId = getDao().getTicketLogId(channel.guild);
    return ticketLogId !== undefined &&                                 // The guild HAS a ticket log channel
        channel.id !== ticketLogId &&                                   // This channel ISN'T the ticket log channel
        channel.parent !== null &&                                      // The channel has a parent
        channel.parent.type === 'category' &&                           // The parent IS a category
        channel.parent.children.get(ticketLogId) !== undefined;         // The parent category CONTAINS the ticket log channel

}

async function channelToText(channel: TextChannel | DMChannel | NewsChannel): Promise<Buffer> {
    const messages = await channel.messages.fetch();
    const messageArray: string[] = [];
    messages.forEach(message => {
        message.attachments.forEach(attachment => {
            if (attachment.url) {
                messageArray.push(attachment.url);
            }
        });
        messageArray.push(`[${message.createdAt}] ${message.author.username}: ${message.content}`);
    });
    return Buffer.from(messageArray.reverse().join('\n'), 'utf-8'); // Reversed so messages read top to bottom
}

export async function closeTicket(command: Command, args: string[], message: Message): Promise<void> {
    if (await isTicketChannel(message.channel)) {
        const ticketChannel = (message.channel as TextChannel);
        const guild = message.guild as Guild;
        const category = await getTicketsCategory(guild);
        const ticketLogChannel = await getTicketLogChannel(category, guild);
        const textLog = await channelToText(ticketChannel);

        const attachment = new MessageAttachment(textLog, `${ticketChannel.name}-log.txt`);

        const uniqueTicketUsers = ticketChannel.members.filter(member => !ticketLogChannel.members.has(member.id));
        const uniqueTicketUsersNames: string[] = [];
        uniqueTicketUsers.forEach(user => {
            uniqueTicketUsersNames.push(`<@!${user.id}>'s`);
        });

        let closeMessage = `${uniqueTicketUsersNames.join(' & ')} ${!uniqueTicketUsers.size ? 'T' : 't'}icket closed by <@!${message.author.id}>`;
        if (args[0]) {
            closeMessage += ` for reason: "${args[0]}"`;
        }

        await ticketLogChannel.send(closeMessage, attachment);
        uniqueTicketUsers.forEach(user => {
            user.send(closeMessage, attachment);
        });

        try {
            await ticketChannel.delete();
        } catch {
            logger.debug(messages.deleteError);
        }
    } else {
        await message.channel.send('Can only close Ticket channels');
    }
}

export async function addUserToTicket(command: Command, args: string[], message: Message): Promise<void> {
    if (await isTicketChannel(message.channel)) {
        const channel = message.channel as TextChannel;

        const newPerson = message.mentions.members?.first();

        if (newPerson) {
            await channel.updateOverwrite(newPerson, { VIEW_CHANNEL: true });
            await message.channel.send(`Added <@!${newPerson.id}> to the ticket.`);
        } else {
            await message.channel.send(`Invalid mention. Must @USERNAME. (Ex: ${getDao().getPrefix(message.guild)}ticket add <@!${message.author.id}>)`);
        }
    } else {
        await message.channel.send('Can only add users in Ticket channels');
    }
}

export async function setTicketLogChannel(command: Command, args: string[], message: Message): Promise<void> {
    const channel = message.mentions.channels?.first();
    if (channel) {
        if (isTextChannel(channel) && message.guild) {
            if (channel.parent && channel.parent.type === 'category') {
                await getDao().setTicketLogId(message.guild, channel.id);
                await message.channel.send(`<#${channel.id}> set as ticket log channel`);
            } else {
                await message.channel.send('Ticket logs channel must have a parent category');
            }
        } else {
            await message.channel.send('Must mention a valid server text channel');
        }
    } else {
        await getDao().setTicketLogId(message.guild!, undefined);
        await message.channel.send('NorseBot\'s ticket log channel has been unset');
    }
}
