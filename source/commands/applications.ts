import { Command } from '../models/command';
import { Message, MessageEmbed } from 'discord.js';
import { getDao } from '../util/database';
import { Application } from '../models/application';
import { sameAuthor } from '../util/util';

const QUESTION_TIMEOUT = 5000; // 10 minutes
const editApplications: Application[] = [];
const activeApplications: Application[] = [];

async function appTimeOut(message: Message): Promise<void> {
    await message.channel.send(`<@!${message.author.id}>, you took too long to respond`);
}

function textToEmbed(text: string): MessageEmbed {
    return new MessageEmbed()
        .setColor('#ffbf00')
        .setDescription(text);
}

/**
 * Gets the next message from the same user who sent a message, throws an error if the timeout time is reached (in ms)
 * @param message DiscordJS Message, who's author must answer a message
 * @param timeout Time in milliseconds
 */
async function getResponse(message: Message, timeout?: number): Promise<Message> {
    const collected = await message.channel.awaitMessages(r => sameAuthor(r, message), {
        max: 1,
        time: timeout || QUESTION_TIMEOUT,
        errors: ['time']
    });
    return collected.first()!; // If there isn't a response the collector will error first
}

export async function newApplyMessage(command: Command, args: string[], message: Message): Promise<void> {
    const channel = message.mentions.channels?.first();
    if (channel) {
        if (channel.type === 'text' && message.guild) {
            await getDao().setApplyChannelId(message.guild, channel.id);

            // TODO: Create application message (save ID)

            await message.channel.send(`New Application Message created in <#${channel.id}> channel`);
        } else {
            await message.channel.send('Must mention a valid server text channel');
        }
    } else {
        await getDao().setApplyChannelId(message.guild!, undefined);
        await message.channel.send('New applications are no longer being polled');
    }
}

export async function createApplication(command: Command, args: string[], message: Message): Promise<void> {
    try {
        await message.channel.send(textToEmbed('What is the role for this new application? (Ex: @Norse)'));
        const role = (await getResponse(message)).mentions.roles.first(); // TODO: Ensure this displays in DMs
        if (role) {
            await message.channel.send(textToEmbed('What is the title of this new application? (Ex: NKU Student)'));
            const title = (await getResponse(message)).content;
            await message.channel.send(textToEmbed('What is the description of this new application? (Ex: Apply here if you currently attend Northern Kentucky University)'));
            const description = (await getResponse(message)).content;
        } else {
            await message.channel.send(textToEmbed('Failed to mention a valid role, restart the application creation process'));
        }

    } catch(error) {
        await appTimeOut(message);
    }
}
