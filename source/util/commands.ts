import { Command } from '../models/command';

export const commands: { [key: string]: Command } = {
    'add': {
        'name': 'Add',
        'description': 'Adds two numbers together (Ex: !add 2 2)',
        'permission': 0,
    },
    'ping': {
        'name': 'Ping',
        'description': 'Calculates how long it took for a user\'s message to reach the bot (Ex: !ping)',
        'permission': 0,
    },
    'get': {
        'name': 'Get Image',
        'description': 'Gets random image given a list of strings as keywords (Ex: !get cool dogs)',
        'permission': 0,
    }
};

export const unknownMessage = 'Command not recognized';