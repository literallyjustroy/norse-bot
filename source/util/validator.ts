import { GuildMember, Message, MessageMentions, TextChannel, User, VoiceChannel } from 'discord.js';

function argsToInteger(args: string[]): number[] {
    return args.map((arg: string) => {
        const parsedArg = +arg;
        if (isNaN(parsedArg) || !Number.isSafeInteger(parsedArg)) {
            throw Error('Not an Integer');
        }
        return parsedArg;
    });
}

function argsToNumber(args: string[]): number[] {
    return args.map((arg: string) => {
        const parsedArg = +arg;
        if (isNaN(parsedArg)) {
            throw Error('Not a Number');
        }
        return parsedArg;
    });
}

export enum Validator {
    STRING ,
    INTEGER,
    NUMBER
}

export function validateArgs(args: string[], argType: Validator.STRING, min?: number, max?: number): string[] | null
export function validateArgs(args: string[], argType: Validator.NUMBER | Validator.INTEGER, min?: number, max?: number): number[] | null
export function validateArgs(args: string[], argType: Validator, min?: number, max?: number): string[] | number[] | null
export function validateArgs(args: string[], argType: Validator, min?: number, max?: number): string[] | number[] | null {
    if (args && (!min || args.length >= min) && (!max || args.length <= max)) {
        try {
            switch (argType) {
                case Validator.STRING:
                    return args as string[];
                case Validator.INTEGER:
                    return argsToInteger(args);
                case Validator.NUMBER:
                    return argsToNumber(args);
                default:
                    return null;
            }
        } catch (error) {
            return null;
        }
    }
    return null;
}

/**
 * Returns the mention of the correct type, otherwise, returns undefined
 * @param mentions
 * @param type
 */
export function getSingleMention(mentions: MessageMentions, type: 'user'): User | undefined
export function getSingleMention(mentions: MessageMentions, type: 'member'): GuildMember | undefined
export function getSingleMention(mentions: MessageMentions, type: 'textchannel'): TextChannel | undefined
export function getSingleMention(mentions: MessageMentions, type: 'user' | 'member' | 'textchannel' ): User | GuildMember | TextChannel | undefined {
    switch(type) {
        case 'user':
            return mentions.users.first();
        case 'member':
            return mentions.members?.first();
        case 'textchannel':
            return mentions.channels?.first();
    }
    return undefined;
}