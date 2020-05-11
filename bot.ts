import { Client, Message } from 'discord.js';
import { logger } from './source/util/log';
import { BotService, parseMessage } from './source/bot-service';
import { unknownMessage } from './source/util/commands';

const bot = new Client();
const botService = new BotService();
const keyword = '!';

bot.on('ready', () => {
    logger.info('Bot Connected');
});

bot.on('message', async (message: Message) => {
    // Listening for messages starting with the keyword
    if (message.content.startsWith(keyword) && !message.author.bot) { // Don't respond to other bots
        const parsedMessage = parseMessage(message.content, keyword);
        const [cmd, args] = [parsedMessage.cmd, parsedMessage.args];

        switch (cmd) {
            case 'ping':
                await botService.ping(message);
                break;
            case 'get':
                await botService.getImage(args, message);
                break;
            case 'add':
                await botService.add(args, message);
                break;
            default:
                await message.channel.send(unknownMessage);
        }
    }
});

bot.login(process.env.BOT_TOKEN)
    .then(() => logger.info('Login Success'));
