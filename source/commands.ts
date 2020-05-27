import { Command } from './models/command';
import { Validator } from './util/validator';
import { addUserToTicket, closeTicket, createTicket, setTicketLogChannel, ticketHandler } from './commands/tickets';
import { setAdmin } from './commands/setadmin';
import { updatePrefix } from './commands/prefix';
import { add, getImage, ping } from './commands/misc';
import { help } from './commands/help';
import { say } from './commands/say';

export const commands: { [key: string]: Command } = {
    add: {
        name: 'Add',
        aliases: ['plus'],
        description: 'Adds two numbers together.',
        example: 'add 2 2',
        validation: {
            type: Validator.NUMBER,
            min: 2,
            max: 2,
            message: 'Must add 2 numbers'
        },
        execute: add
    },
    setadmin: {
        name: 'Set Admin Role',
        aliases: ['admin', 'adminrole'],
        description: 'Sets the given role as a bot controlling role, or wipes the admin role if no argument is given',
        example: 'setadmin @Moderator',
        validation: {
            type: Validator.STRING,
            max: 1,
            message: 'Must provide a single role'
        },
        permission: 3,
        channelType: 'server',
        execute: setAdmin
    },
    get: {
        name: 'Get Image',
        aliases: ['random', 'image', 'getimage'],
        description: 'Gets random image given a list of strings as keywords.',
        example: 'get cool dogs',
        validation: {
            type: Validator.STRING,
            min: 1,
            message: 'Must provide at least 1 search term'
        },
        execute: getImage
    },
    help: {
        name: 'Help',
        description: 'Gets the description of all commands (or command specified).',
        example: 'help ticket',
        execute: help
    },
    ping: {
        name: 'Ping',
        description: 'Calculates how long it took for a user\'s message to reach the bot.',
        example: 'ping',
        execute: ping
    },
    prefix: {
        name: 'Set Command Prefix',
        aliases: ['setprefix', 'key', 'setkey', 'keyword', 'setkeyword'],
        description: 'Sets the server\'s command prefix (How to begin a command)',
        example: 'prefix ?',
        validation: {
            type: Validator.STRING,
            min: 1,
            max: 1,
            message: 'Must provide a non-spaced, valid prefix'
        },
        permission: 2,
        channelType: 'server',
        execute: updatePrefix
    },
    say: {
        name: 'Speak in a channel',
        aliases: ['echo', 'speak'],
        description: 'Talk through NorseBot in another discord channel',
        example: 'say #general Howdy I am a moth',
        validation: {
            type: Validator.STRING,
            min: 2,
            message: 'Must provide a channel and words to say'
        },
        permission: 2,
        channelType: 'server',
        execute: say
    },
    ticket: {
        name: 'Tickets',
        aliases: ['tickets'],
        description: 'Contains ticket commands.',
        example: 'ticket create jeff hit me',
        validation: {
            type: Validator.STRING,
            min: 1,
            message: 'Must provide at least one sub-command'
        },
        channelType: 'server',
        execute: ticketHandler,
        subCommands: {
            create: {
                name: 'Create Ticket',
                aliases: ['new', 'open', 'make'],
                description: 'Creates a ticket with the name given.',
                example: 'ticket create jeff hit me',
                execute: createTicket
            },
            close: {
                name: 'Close Ticket',
                aliases: ['stop', 'cancel', 'remove', 'end', 'finish', 'done'],
                description: 'Closes the ticket this message was sent in.',
                example: 'ticket close jeff said it was an accident :)',
                execute: closeTicket
            },
            add: {
                name: 'Add User to Ticket',
                aliases: ['adduser'],
                description: 'Adds the given user to the ticket this message was sent in.',
                example: 'ticket add @Roy [Visual2D]',
                validation: {
                    type: Validator.STRING,
                    min: 1,
                    max: 1,
                    message: 'Must provide a single user'
                },
                execute: addUserToTicket
            },
            log: {
                name: 'Set Ticket Log Channel',
                aliases: ['logs', 'setlog', 'setlogs', 'logchannel', 'transcript', 'transcripts'],
                description: 'Sets the text channel to record ticket logs in, or unsets the channel if no argument is given',
                example: 'ticket log #ticket-transcripts ',
                validation: {
                    type: Validator.STRING,
                    max: 1,
                    message: 'Must provide a text channel'
                },
                permission: 2,
                execute: setTicketLogChannel
            }
        }
    }
};