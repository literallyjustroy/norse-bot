import { Client, Message } from 'discord.js';
import { logger } from './source/util/log';
import { commands } from './source/util/commands';
import messages from './source/util/messages.json';
import { executeCommand, parseMessage } from './source/util/parsing';

const bot = new Client();
const keyword = '!';

bot.on('ready', () => {
    logger.info('Bot Connected');
});

bot.on('message', async (message: Message) => {
    // Listening for messages starting with the keyword
    if (message.content.startsWith(keyword) && !message.author.bot) { // Don't respond to other bots
        try {
            const parsedMessage = parseMessage(message.content, keyword);
            const command = commands[parsedMessage.cmd];

            await executeCommand(command, parsedMessage.args, message);
        } catch (error) {
            logger.error(error);
            await message.channel.send(messages.errorMessage);
        }
    }
});

bot.login(process.env.BOT_TOKEN)
    .then(() => logger.info('Login Success'));
