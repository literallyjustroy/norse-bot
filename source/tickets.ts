import { Message } from 'discord.js';
import { argsToString } from './bot-service';

async function createTicket(ticketName: string, message: Message) {
    // Get 'Tickets' category (if none, create one).
    // Create a text channel in the category
    // give permissions to each user
    // paste info about ticket creator "Ticket created by ___ at TIME"
    // paste info about ticket commands (close, add)
}

export async function ticketHandler(args: string[], message: Message) {
    switch(args[0]) {
        case 'create':
        case 'open':
            const ticketName = argsToString(args);
            await createTicket(ticketName, message);
            break;
        default:
            await message.channel.send('Invalid ticket sub-command. Try "!help ticket"');
    }
}