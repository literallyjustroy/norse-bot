import { CategoryChannel, DMChannel, Guild, Message, NewsChannel, TextChannel } from 'discord.js';
import { executeCommand, argsToString, generateValidationMessage } from '../util/parsing';
import { commands } from "../util/commands";
import { Command } from "../models/command";

const TICKET_CATEGORY_NAME = 'Tickets';
const TICKET_TOPIC_TEXT = 'To close the ticket type "!ticket close OPTIONAL_REASON". To add another user type "!ticket add NAME".';

async function getTicketsCategory(guild: Guild): Promise<CategoryChannel> {
    let ticketsCategory = await guild.channels.cache.find(channel =>
        channel.type == 'category' && channel.name == TICKET_CATEGORY_NAME
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
                topic: TICKET_TOPIC_TEXT,
                parent: category,
            }
    );
    await textChannel.lockPermissions(); // Sync with category permissions
    await textChannel.updateOverwrite(message.author.id, { VIEW_CHANNEL: true });
    return textChannel;
}

export async function createTicket(command: Command, args: string[], message: Message): Promise<void> {
    const ticketName = args[0];
    const guild = message.guild as Guild;
    if (ticketName && ticketName.length && ticketName.length <= 100) {
        const category = await getTicketsCategory(guild);
        const ticketChannel = await createTicketTextChannel(ticketName, category, message, guild);

        await ticketChannel.send(`Ticket "${ticketName}" opened by ${message.author.tag} on ${message.createdAt}`);
        await message.delete();
    } else {
        await message.channel.send(generateValidationMessage(command));
    }
}

async function isTicketChannel(channel: TextChannel | DMChannel | NewsChannel): Promise<boolean> {
    return channel.type === 'text' &&
        channel.topic == TICKET_TOPIC_TEXT &&
        channel.parent !== null &&
        channel.parent.name === TICKET_CATEGORY_NAME;
}

export async function closeTicket(command: Command, args: string[], message: Message): Promise<void> {
    if (await isTicketChannel(message.channel)) {
        const reason = args[0];
        if (reason) {
            await message.channel.send(`Ticket closed by ${message.author.tag} on ${message.createdAt} for reason: "${reason}"`);
        }
        // Create archive text channel (use getTicketCategory())
        // TODO: Log ticket as .txt file
        // send messages with the .txt file to the user who created/were added (this will require a database)
        // look up how to do asyncronous message sending
        // Post message in the channel
        await message.channel.delete();
    } else {
        await message.channel.send('Can only close Ticket channels');
    }
}

export async function ticketHandler(command: Command, args: string[], message: Message): Promise<void> {
    if (message.guild && command.subCommands) {
        const subCommand = command.subCommands[args[0].toLowerCase()];
        if (subCommand) {
            await executeCommand(subCommand, [argsToString(args)], message);
        } else {
            await message.channel.send('Invalid ticket sub-command (try !help ticket)');
        }
    } else {
        await message.channel.send('Ticket commands must be sent in a server text channel');
    }
}