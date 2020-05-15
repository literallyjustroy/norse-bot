import { Validator } from '../util/validator';
import { Message } from 'discord.js';

export interface Command {
    name: string;
    description: string;
    permission: number;
    validation?: ValidationOptions;
    example: string;
    subCommands?: { [key: string]: Command };
    execute?: (command: Command, nums: any[], message: Message) => Promise<void>;
}

interface ValidationOptions {
    type: Validator;
    min?: number;
    max?: number;
    message: string;
}