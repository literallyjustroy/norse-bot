import { Validator } from '../util/validator';
import { Message } from 'discord.js';

export interface Command {
    name: string;
    aliases?: string[];
    description: string;
    permission?: number;
    channelType?: 'server' | 'dm';
    validation?: ValidationOptions;
    example: string;
    subCommands?: { [key: string]: Command };
    execute?: (command: Command, nums: any[], message: Message) => Promise<void> | void;
}

interface ValidationOptions {
    type: Validator;
    min?: number;
    max?: number;
    message: string;
}