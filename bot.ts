import { Client, Message } from 'discord.js';
import { logger } from './source/util/log';
import { BotService, parseMessage } from './source/bot-service';
import { errorMessage, unknownMessage } from './source/util/commands';

const bot = new Client();
const botService = new BotService();
const keyword = '!';

bot.on('ready', () => {
    logger.info('Bot Connected');
});

bot.on('message', async (message: Message) => {
    // Listening for messages starting with the keyword
    if (message.content.startsWith(keyword) && !message.author.bot) { // Don't respond to other bots
        try {
            const parsedMessage = parseMessage(message.content, keyword);
            const [cmd, args] = [parsedMessage.cmd, parsedMessage.args];
            console.log(message.content);
            console.log(args);

            switch (cmd) {
                case 'add':
                    await botService.add(args, message);
                    break;
                case 'get':
                    await botService.getImage(args, message);
                    break;
                case 'ping':
                    await botService.ping(message);
                    break;
                case 'ticket':
                    await botService.ticket(args, message);
                    break;
                default:
                    await message.channel.send(unknownMessage);
            }
        } catch (error) {
            logger.error(error);
            await message.channel.send(errorMessage);
        }
    }
});

bot.login(process.env.BOT_TOKEN)
    .then(() => logger.info('Login Success'));
