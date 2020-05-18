import { Command } from '../models/command';
import { add, getImage, ping, ticket, ticketClose, ticketCreate } from '../bot-service';
import { Validator } from './validator';
import { addUserToTicket } from '../commands/tickets';

export const commands: { [key: string]: Command } = {
    add: {
        name: 'Add',
        aliases: ['plus'],
        description: 'Adds two numbers together.',
        example: '!add 2 2',
        validation: {
            type: Validator.NUMBER,
            min: 2,
            max: 2,
            message: 'Must add 2 numbers'
        },
        permission: 0,
        execute: add
    },
    get: {
        name: 'Get Image',
        aliases: ['random', 'image', 'getimage'],
        description: 'Gets random image given a list of strings as keywords.',
        example: '!get cool dogs',
        validation: {
            type: Validator.STRING,
            min: 1,
            message: 'Must provide at least 1 search term'
        },
        permission: 0,
        execute: getImage
    },
    ping: {
        name: 'Ping',
        description: 'Calculates how long it took for a user\'s message to reach the bot.',
        example: '!ping',
        permission: 0,
        execute: ping
    },
    ticket: {
        name: 'Tickets',
        aliases: ['tickets'],
        description: 'Contains ticket commands.',
        permission: 0,
        example: '!ticket create NAME_HERE',
        validation: {
            type: Validator.STRING,
            min: 1,
            message: 'Must provide at least one sub-command'
        },
        execute: ticket,
        subCommands: {
            create: {
                name: 'Create Ticket',
                aliases: ['new', 'open', 'make'],
                description: 'Creates a ticket with the name given.',
                example: '!ticket create OPTIONAL_NAME',
                validation: {
                    type: Validator.STRING,
                    message: 'Invalid ticket name'
                },
                permission: 0,
                execute: ticketCreate
            },
            close: {
                name: 'Close Ticket',
                aliases: ['stop', 'cancel', 'remove', 'end', 'finish', 'done'],
                description: 'Closes the ticket this message was sent in.',
                example: '!ticket close OPTIONAL_REASON',
                permission: 0,
                execute: ticketClose
            },
            add: {
                name: 'Add User to Ticket',
                aliases: ['adduser'],
                description: 'Adds the given user to the ticket this message was sent in.',
                example: '!ticket add @username',
                validation: {
                    type: Validator.STRING,
                    min: 1,
                    max: 1,
                    message: 'Must provide a single user'
                },
                permission: 0,
                execute: addUserToTicket
            }
        }
    }
};