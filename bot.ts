import { Client, Message } from 'discord.js';
import { logger } from './source/util/log';
import { commands } from './source/util/commands';
import messages from './source/util/messages.json';
import { executeCommand, getCommand, parseMessage } from './source/util/parsing';
import { closeConnection, getPrefix } from './source/util/database';

const bot = new Client();

if (!process.env.BOT_TOKEN) {
    logger.error({ message: 'Environment variable BOT_TOKEN not setup' });
    process.exit(1);
}

bot.on('ready', () => {
    logger.info('Bot Connected');
});

bot.on('message', async (message: Message) => {
    try {
        const prefix = await getPrefix(message.guild);

        // Listening for messages starting with the prefix
        if (message.content.startsWith(prefix) && !message.author.bot) { // Don't respond to other bots
            const parsedMessage = parseMessage(message.content, prefix);
            const command = getCommand(parsedMessage.cmd, commands);

            await executeCommand(command, parsedMessage.args, message);
        }
    } catch (error) {
        logger.error({ user: message.author.username, input: message.content, message: JSON.stringify(error) });
        await message.channel.send(messages.errorMessage);
    }
});

bot.login(process.env.BOT_TOKEN)
    .then(() => logger.info('Login Success'));

// This will handle process.exit():
process.on('exit', closeConnection);

// This will handle kill commands, such as CTRL+C:
process.on('SIGINT', closeConnection);
process.on('SIGTERM', closeConnection);
process.on('SIGKILL', closeConnection);

// This will prevent dirty exit on code-fault crashes:
process.on('uncaughtException', closeConnection);