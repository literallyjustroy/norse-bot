import { Command } from '../models/command';

export const commands: { [key: string]: Command } = {
    add: {
        name: 'Add',
        description: 'Adds two numbers together.',
        example: '!add 2 2',
        permission: 0,
    },
    get: {
        name: 'Get Image',
        description: 'Gets random image given a list of strings as keywords.',
        example: '!get cool dogs',
        permission: 0,
    },
    ping: {
        name: 'Ping',
        description: 'Calculates how long it took for a user\'s message to reach the bot.',
        example: '!ping',
        permission: 0,
    },
    ticket: {
        name: 'Tickets',
        description: 'Contains ticket commands.',
        permission: 0,
        example: '!ticket create NAME_HERE',
        subCommands: {
            create: {
                name: 'Create Ticket',
                description: 'Creates a ticket with the name given.',
                example: '!ticket create NAME_HERE',
                permission: 0,
            },
            close: {
                name: 'Close Ticket',
                description: 'Closes the ticket this message was sent in.',
                example: '!ticket create NAME_HERE',
                permission: 0,
            },
            add: {
                name: 'Add User to Ticket',
                description: 'Adds the given user to the ticket this message was sent in (Ex: !ticket add billy)',
                example: '!ticket create NAME_HERE',
                permission: 0,
            }
        }
    }
};

export const unknownMessage = 'Command not recognized';
export const errorMessage = 'Uh oh.. An unknown error occurred.';