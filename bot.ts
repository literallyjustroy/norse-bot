import { Client, Message }  from 'discord.js';
import { add, ping, randomImage } from './source/functions';
import { logger }  from './source/log';
const auth = require('./auth.json');

// Initialize Discord Bot
const bot = new Client();

bot.on('ready', () => {
    logger.info('Bot Connected');
});

bot.on('message', async (message: Message) => {
    // It will listen for messages that will start with `!`
    if (message.content.substring(0, 1) === '!' && !message.author.bot) { // won't respond to other bots
        let args = message.content.substring(1).split(' ');
        const cmd = args[0];

        args = args.splice(1);
        logger.debug(`cmd: '${cmd}'`);
        logger.debug(`args: [${args}]`);

        switch (cmd) {
            case 'ping':
                await message.channel.send(ping());
                break;
            case 'smile':
                await message.react('😄');
                break;
            case 'get': { // provides an image of the requested topic
                let result = await randomImage(args);
                await message.channel.send(result);
                break;
            }
            case 'add':
                await message.channel.send(add(args));
                break;
            default:
                // TODO: check if channelID is userID, if so: tell the bot to use !help or something
        }
    }
});

bot.login(auth.token).then(r => logger.info(`Bot Authenticated: ${r}`));
