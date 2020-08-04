import { Message } from 'discord.js';

export function sameAuthor(response: Message, original: Message): boolean {
    return response.author.id === original.author.id;
}

export async function sleep(ms: number): Promise<any> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function capitalizeFirstLetter(string: string): string {
    return string.charAt(0).toUpperCase() + string.slice(1);
}