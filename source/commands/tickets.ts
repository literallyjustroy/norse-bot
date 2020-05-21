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
import { capitalizeFirstLetter } from '../util/util';
import { getDao } from '../util/database';

const TICKET_CATEGORY_NAME = 'Tickets';
const TICKET_LOG_NAME = 'ticket-logs';
const TICKET_LOG_TOPIC_TEXT = 'Logs of every ticket closed';

async function getTicketsCategory(guild: Guild): Promise<CategoryChannel> {
    let ticketsCategory = await guild.channels.cache.find(channel =>
        channel.type === 'category' && channel.name === TICKET_CATEGORY_NAME
    ) as CategoryChannel;
    if (!ticketsCategory) {
        ticketsCategory = await guild.channels.create(
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
    return ticketsCategory;
}

async function createTicketTextChannel(ticketName: string, category: CategoryChannel, message: Message, guild: Guild): Promise<TextChannel> {
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

        await botResponse.delete({ timeout: 15000 });
        await message.delete({ timeout: 15000 });
    } else {
        await message.channel.send(generateValidationMessage(command));
    }
}

async function isTicketChannel(channel: TextChannel | DMChannel | NewsChannel): Promise<boolean> {
    return channel.type === 'text' &&
        channel.parent !== null &&
        channel.parent.name === TICKET_CATEGORY_NAME &&
        channel.name !== TICKET_LOG_NAME;
}

async function getTicketLogChannel(category: CategoryChannel, guild: Guild): Promise<TextChannel> {
    let ticketLogChannel = await guild.channels.cache.find(channel =>
        channel.parent === category && channel.type === 'text' && channel.name === TICKET_LOG_NAME
    ) as TextChannel;
    if (!ticketLogChannel) {
        ticketLogChannel = await guild.channels.create(
            TICKET_LOG_NAME,
            {
                type: 'text',
                topic: TICKET_LOG_TOPIC_TEXT,
                position: 0,
                parent: category,
            }
        );
        await ticketLogChannel.lockPermissions(); // Sync with category permissions
    }
    return ticketLogChannel;
}

async function channelToText(channel: TextChannel | DMChannel | NewsChannel): Promise<Buffer> {
    const messages = await channel.messages.fetch();
    const messageArray: string[] = [];
    messages.forEach(message => {
        messageArray.push(`[${message.createdAt}] ${message.author.username}: ${message.content}`);
    });
    return Buffer.from(messageArray.reverse().join('\n'), 'utf-8');
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

        await ticketChannel.delete();
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

export async function ticketHandler(command: Command, args: string[], message: Message): Promise<void> {
    if (message.guild && command.subCommands) {
        const subCommand = getCommand(args[0].toLowerCase(), command.subCommands);
        if (subCommand) {
            await executeCommand(subCommand, [argsToString(args)], message);
        } else {
            await message.channel.send(`Invalid ticket sub-command (try ${getDao().getPrefix(message.guild)}help ticket)`);
        }
    } else {
        await message.channel.send('Ticket commands must be sent in a server text channel');
    }
}