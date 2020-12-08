import {
    Channel,
    ChannelManager,
    DMChannel,
    Message,
    MessageEmbed,
    MessageManager,
    MessageReaction,
    NewsChannel, Role,
    TextChannel,
    User
} from 'discord.js';

export enum Colors {
    Success = '#76b155',
    Failure = '#db2e44'
}

export const NUMBER_EMOJI = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

export async function safeFetch(manager: ChannelManager, id: string): Promise<Channel | undefined>;
export async function safeFetch(manager: MessageManager, id: string): Promise<Message | undefined>;

export async function safeFetch(manager: ChannelManager | MessageManager, id: string): Promise<Channel | Message | undefined> {
    try {
        return await manager.fetch(id);
    } catch (error) {
        return undefined;
    }
}

export function isTextChannel(channel: Channel | undefined): channel is TextChannel {
    return channel !== undefined && channel.type === 'text';
}

export function isNewsChannel(channel: Channel | undefined): channel is NewsChannel {
    return channel !== undefined && channel.type === 'news';
}

export function isDMChannel(channel: Channel | undefined): channel is DMChannel {
    return channel !== undefined && channel.type === 'dm';
}

export async function sleep(ms: number): Promise<any> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function capitalizeFirstLetter(string: string): string {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

export async function appTimeOut(channel: TextChannel | DMChannel | NewsChannel, user: User): Promise<void> {
    await channel.send(`<@!${user.id}>, you took too long to respond`);
}

export function textToEmbed(text: string): MessageEmbed {
    return new MessageEmbed()
        .setColor('#3b87c2')
        .setDescription(text);
}

export async function sendSuccess(channel: TextChannel | DMChannel | NewsChannel, text: string): Promise<Message> {
    return await channel.send(textToEmbed(`✅ ${text}`).setColor(Colors.Success));
}

export async function sendError(channel: TextChannel | DMChannel | NewsChannel, text: string): Promise<Message> {
    return await channel.send(textToEmbed(`❌ ${text}`).setColor(Colors.Failure));
}

/**
 * Adds reactions in order to message
 * @param message
 * @param emojiOptions
 */
export async function addReactions(message: Message, emojiOptions: string[]): Promise<void> {
    for (const emoji of emojiOptions) {
        await message.react(emoji);
    }
}

/**
 * Generates the string to be placed at the footer of an optioned message
 * @param options
 */
export function optionsString(options: { symbol: string; label: string }[] ): string {
    let stringGenerator = '';
    options.forEach(emoji => {
        stringGenerator += `\n${emoji.symbol} - ${emoji.label}`;
    });
    return stringGenerator;
}

/**
 * Listens for any of the emoji reactions specified and returns the first MessageReaction matching
 * @param message
 * @param emojiOptions
 * @param timeout
 * @param userToReact
 */
export async function reactionSelect(message: Message, emojiOptions: string[], timeout?: number, userToReact?: User): Promise<MessageReaction | undefined> {
    addReactions(message, emojiOptions); // Runs without waiting, but reactions wait in order
    const reactions = await message.awaitReactions((reaction, user) =>
        !user.bot &&
        (!userToReact || user.id === userToReact.id) &&
        emojiOptions.includes(reaction.emoji.name),
        {
            max: 1,
            time: timeout
        }
    );

    return reactions.first();
}

/**
 * Gets the next message from the same user who sent a message, throws an error if the timeout time is reached (in ms)
 * Throws an error if the message isn't received within the timeout period
 * @param channel The channel a response should be in
 * @param user The user who should be responding
 * @param characterLimit Lets user know if max character limit is exceeded and will request new submission
 * @param timeout Time in milliseconds
 */
export async function getResponse(channel: TextChannel | DMChannel | NewsChannel, user: User, characterLimit: number | undefined, timeout?: number): Promise<Message> {
    let validAnswer: Message | undefined;

    while (!validAnswer) {
        const collected = await channel.awaitMessages(r => r.author.id === user.id, {
            max: 1,
            time: timeout,
            errors: ['time']
        });
        const messageLength: number | undefined = collected?.first()?.content.length;
        if (messageLength && (characterLimit === undefined || messageLength <= characterLimit)) {
            validAnswer = collected.first();
        } else {
            await sendError(channel, `Your reply exceeds the ${characterLimit} character limit. Please try again.`);
        }
    }
    return validAnswer; // If there isn't a response the collector will error first
}

export async function getOptionalRole(message: string, channel: TextChannel | DMChannel | NewsChannel, user: User, timeout?: number): Promise<Role | undefined> {
    await channel.send(textToEmbed(message));
    const role = (await getResponse(channel, user, undefined, timeout)).mentions.roles.first();
    if (role) {
        return role;
    } else {
        await channel.send(textToEmbed('No role selected.'));
    }
    return undefined;
}
