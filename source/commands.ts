import { Command } from './models/command';
import { Validator } from './util/validator';
import { addUserToTicket, closeTicket, createTicket, setTicketLogChannel } from './commands/tickets';
import { setAdmin } from './commands/setadmin';
import { updatePrefix } from './commands/prefix';
import { add, getImage, ping } from './commands/misc';
import { help } from './commands/help';
import { say } from './commands/say';
import { setStreamChannel, setStreamRole } from './commands/presence-integration';
import { createApplication, deleteApplication, newApplyMessage, setReviewChannel } from './commands/applications';
import { subCommandHandler } from './util/parsing';

export const commands: { [key: string]: Command } = {
    add: {
        name: 'Add',
        aliases: ['plus'],
        description: 'Adds two numbers together',
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
        description: 'Gets random image given a list of strings as keywords',
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
        description: 'Gets the description of all commands (or command specified)',
        example: 'help ticket',
        execute: help
    },
    ping: {
        name: 'Ping',
        description: 'Calculates how long it took for a user\'s message to reach the bot',
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
        execute: subCommandHandler,
        subCommands: {
            create: {
                name: 'Create Ticket',
                aliases: ['new', 'open', 'make'],
                description: 'Creates a ticket with the name given',
                example: 'ticket create jeff hit me',
                execute: createTicket
            },
            close: {
                name: 'Close Ticket',
                aliases: ['stop', 'cancel', 'remove', 'end', 'finish', 'done'],
                description: 'Closes the ticket this message was sent in',
                example: 'ticket close jeff said it was an accident :)',
                execute: closeTicket
            },
            add: {
                name: 'Add User to Ticket',
                aliases: ['adduser'],
                description: 'Adds the given user to the ticket this message was sent in',
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
                example: 'ticket log #ticket-transcripts',
                validation: {
                    type: Validator.STRING,
                    max: 1,
                    message: 'Must provide one text channel'
                },
                permission: 2,
                execute: setTicketLogChannel
            }
        }
    },
    stream: {
        name: 'Streams',
        aliases: ['streams'],
        description: 'Contains streaming notification commands. Set a streaming notification channel with **stream channel #channel-name**, and set a streamer role with **stream role @rolename**',
        example: 'stream channel #stream-notifications',
        validation: {
            type: Validator.STRING,
            min: 1,
            message: 'Must provide at least one sub-command'
        },
        channelType: 'server',
        execute: subCommandHandler,
        subCommands: {
            channel: {
                name: 'Set Stream Notification Channel',
                aliases: ['set', 'setchannel'],
                description: 'Sets the text channel to post streaming notifications in, or unsets the channel if no argument is given',
                example: 'stream channel #streaming-notifications',
                validation: {
                    type: Validator.STRING,
                    max: 1,
                    message: 'Must provide one text channel'
                },
                permission: 2,
                execute: setStreamChannel
            },
            role: {
                name: 'Set Streamer Role',
                aliases: ['setrole', 'streamer'],
                description: 'Sets the given role that will be watched to post when they go live, or unsets the streamer role if no argument is given',
                example: 'role @Streamer',
                validation: {
                    type: Validator.STRING,
                    max: 1,
                    message: 'Must provide a single role'
                },
                permission: 2,
                execute: setStreamRole
            }
        }
    },
    app: {
        name: 'Applications',
        aliases: ['apps', 'application', 'applications'],
        description: 'Contains role application commands. Set an apply channel with **app applychannel #channel-name**, set a review channel with **app reviewchannel #channel-name**, and create a new app with **app create**',
        example: 'app new',
        validation: {
            type: Validator.STRING,
            min: 1,
            message: 'Must provide at least one sub-command'
        },
        channelType: 'server',
        execute: subCommandHandler,
        subCommands: {
            applychannel: {
                name: 'Create new NorseBot app. message',
                aliases: ['newapply', 'setapply'],
                description: 'Sets the text channel to post the bot\'s application message (where people apply), or unsets the channel if no argument is given',
                example: 'app applychannel #new-student-apps',
                validation: {
                    type: Validator.STRING,
                    max: 1,
                    message: 'Must provide one text channel'
                },
                permission: 2,
                execute: newApplyMessage
            },
            reviewchannel: {
                name: 'Set app. review channel',
                aliases: ['review', 'reviews', 'setreview', 'logchannel'],
                description: 'Sets the text channel to post user\'s finished apps for review, or unsets the channel if no argument is given',
                example: 'app reviewchannel #application-logs',
                validation: {
                    type: Validator.STRING,
                    max: 1,
                    message: 'Must provide one text channel'
                },
                permission: 2,
                execute: setReviewChannel
            },
            new: {
                name: 'Create New Application',
                aliases: ['create'],
                description: 'Starts the process to create a new Application for an @role',
                example: 'app new',
                permission: 2,
                execute: createApplication
            },
            delete: {
                name: 'Delete Application',
                aliases: ['del', 'delete', 'remove'],
                description: 'Starts the process to delete an Application for an @role',
                example: 'app delete',
                permission: 2,
                execute: deleteApplication
            }
        }
    }
};