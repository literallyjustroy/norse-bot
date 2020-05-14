import { CategoryChannel, DMChannel, Guild, Message, NewsChannel, TextChannel } from 'discord.js';
import { argsToString, generateValidationMessage } from './bot-service';
import { commands } from './util/commands';

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
    await textChannel.lockPermissions(); // Sync with category
    await textChannel.updateOverwrite(message.author.id, { VIEW_CHANNEL: true });
    return textChannel;
}

async function createTicket(ticketName: string, message: Message, guild: Guild): Promise<void> {
    const category = await getTicketsCategory(guild);
    const ticketChannel = await createTicketTextChannel(ticketName, category, message, guild);

    await ticketChannel.send(`Ticket "${ticketName}" opened by ${message.author.tag} on ${message.createdAt}`);
    await message.delete();
}

async function isTicketChannel(channel: TextChannel | DMChannel | NewsChannel): Promise<boolean> {
    return channel.type === 'text' &&
        channel.topic == TICKET_TOPIC_TEXT &&
        channel.parent !== null &&
        channel.parent.name === TICKET_CATEGORY_NAME;
}

export async function ticketHandler(args: string[], message: Message): Promise<void> {
    if (message.guild) {
        switch (args[0].toLowerCase()) {
            case 'create':
            case 'open':
                const ticketName = argsToString(args);
                if (ticketName.length >= 1 && ticketName.length <= 100) {
                    await createTicket(ticketName, message, message.guild);
                } else {
                    await message.channel.send('Must provide ticket name'); // TODO: get this message from commands.ts
                }
                break;
            case 'close':
                if (await isTicketChannel(message.channel)) {
                    const reason = argsToString(args);
                    // TODO: log channel with reason
                    await message.channel.delete();
                } else {
                    await message.channel.send('Can only close Ticket channels');
                }
                break;
            default:
                await message.channel.send('Invalid ticket sub-command. Try "!help ticket"');
        }
    } else {
        await message.channel.send('Ticket commands must be sent in a server text channel');
    }
}