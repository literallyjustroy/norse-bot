import { Client, Guild, Message } from 'discord.js';
import { logger } from './source/util/log';
import { commands } from './source/commands';
import messages from './source/util/messages.json';
import { executeCommand, getCommand, parseMessage } from './source/util/parsing';
import { dao } from './source/util/database';

if (!process.env.BOT_TOKEN) {
    logger.error({ message: 'Bot token not provided' });
    process.exit(1);
}

const bot = new Client();

// BOT EVENTS

bot.on('ready', async () => {
    logger.info('Bot Connected');
    await dao.initializeMemory(bot);
    logger.info('Memory Loaded');
});

bot.on('message', async (message: Message) => {
    try {
        if (!message.author.bot) { // Don't respond to other bots
            const prefix = dao.getPrefix(message.guild);

            // Listening for messages starting with the prefix
            if (message.content.startsWith(prefix)) {
                const parsedMessage = parseMessage(message.content, prefix);
                const command = getCommand(parsedMessage.cmd, commands);

                await executeCommand(command, parsedMessage.args, message);
            }
        }
    } catch (error) {
        logger.error({ user: message.author.username, input: message.content, message: error.message });
        await message.channel.send(messages.errorMessage);
    }
});

bot.on('guildCreate', async (guild: Guild) => {
    await dao.setNewGuildInMemory(guild);
});

// BOT START

logger.info('Connecting to database...');
dao.client.once('open', () => {
    logger.info('Connected to database');
    bot.login(process.env.BOT_TOKEN).then(() =>
        logger.info('Login Success')
    );
});

// OTHER EVENTS

async function shutdown(bot: Client): Promise<void> {
    bot.destroy();
    await dao.closeConnection();
    process.exit(0);
}

// This will handle process.exit():
process.on('exit', async () => { await shutdown(bot); });

// This will handle kill commands, such as CTRL+C:
process.on('SIGINT', async () => { await shutdown(bot); });

// This will prevent dirty exit on code-fault crashes:
process.on('uncaughtException', async () => { await shutdown(bot); });