import { Client, Guild, Message } from 'discord.js';
import { logger } from './source/util/log';
import { commands } from './source/commands';
import messages from './source/util/messages.json';
import { executeCommand, getCommand, parseMessage } from './source/util/parsing';
import { closeConnection, getPrefix, initializeMemory, setNewGuildInMemory } from './source/util/database';

const bot = new Client();

if (!process.env.BOT_TOKEN || !process.env.DB_LOGIN_URL) {
    logger.error({ message: 'Environment variables not setup' });
    process.exit(1);
}

// BOT EVENTS

bot.on('ready', async () => {
    logger.info('Bot Connected');
    await initializeMemory(bot);
    logger.info('Memory Loaded');
});

bot.on('message', async (message: Message) => {
    try {
        if (!message.author.bot) { // Don't respond to other bots
            const prefix = getPrefix(message.guild);

            // Listening for messages starting with the prefix
            if (message.content.startsWith(prefix)) {
                const parsedMessage = parseMessage(message.content, prefix);
                const command = getCommand(parsedMessage.cmd, commands);

                await executeCommand(command, parsedMessage.args, message);
            }
        }
    } catch (error) {
        logger.error({ user: message.author.username, input: message.content, message: JSON.stringify(error) });
        await message.channel.send(messages.errorMessage);
    }
});

bot.on('guildCreate', async (guild: Guild) => {
    await setNewGuildInMemory(guild);
});

// BOT START

bot.login(process.env.BOT_TOKEN).then(() =>
    logger.info('Login Success')
);

// OTHER EVENTS

// This will handle process.exit():
process.on('exit', closeConnection);

// This will handle kill commands, such as CTRL+C:
process.on('SIGINT', closeConnection);
process.on('SIGTERM', closeConnection);

// This will prevent dirty exit on code-fault crashes:
process.on('uncaughtException', closeConnection);