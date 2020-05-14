import { Client, Message } from 'discord.js';
import { logger } from './source/util/log';
import { generateValidationMessage, parseMessage } from './source/bot-service';
import { commands, errorMessage, unknownMessage } from './source/util/commands';
import { validateArgs } from './source/util/validator';

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
            const [cmd, args] = [parsedMessage.cmd, parsedMessage.args];
            const command = commands[cmd];
            console.log(cmd, args);

            if (command && command.execute) {
                if (command.validation) {
                    const validArgs = validateArgs(args, command.validation.type, command.validation.min, command.validation.max);
                    if (validArgs) {
                        command.execute(validArgs, message);
                    } else {
                        await message.channel.send(generateValidationMessage(command));
                    }
                } else {
                    command.execute(args, message);
                }
            } else {
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
