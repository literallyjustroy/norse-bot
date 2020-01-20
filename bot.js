const Discord = require('discord.js');
const logger = require('winston');
const auth = require('./auth.json');
const botFunctions = require('./source/functions');

// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console(), {
    colorize: true,
});
logger.level = 'debug';

// Initialize Discord Bot
const bot = new Discord.Client();

bot.on('ready', () => {
    logger.info('Bot Connected');
});

bot.on('message', (message) => {
    // It will listen for messages that will start with `!`
    if (message.content.substring(0, 1) === '!' && !message.author.bot) { // won't respond to other bots
        let args = message.content.substring(1).split(' ');
        const cmd = args[0];

        args = args.splice(1);
        logger.debug(`cmd: '${cmd}'`);
        logger.debug(`args: [${args}]`);

        switch (cmd) {
            // !ping
            case 'ping':
                message.channel.send('Pong!');
            break;
            case 'add':
                message.channel.send(botFunctions.add(args, logger));
            break;
            default:
        }
    }
});

bot.login(auth.token);
