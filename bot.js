const Discord = require('discord.js');
const logger = require('winston');
const auth = require('./auth.json');
const botFunctions = require('./source/functions');
const ytFunctions = require('./source/ytplayer.js');

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

const queue = new Map();  

bot.on('message', async message => {
    // It will listen for messages that will start with `!`
    if (message.content.substring(0, 1) === '!' && !message.author.bot) { // won't respond to other bots
        let args = message.content.substring(1).split(' ');
        const cmd = args[0];

        const serverQueue = queue.get(message.guild.id);    // For the YouTube audio   
                                 
        args = args.splice(1);
        logger.debug(`cmd: '${cmd}'`);
        logger.debug(`args: [${args}]`);

        switch (cmd) {
            case 'ping':
                await message.channel.send('Pong!');
                break;
            case 'smile':
                await message.react('😄');
                break;
            case 'get': { // provides an image of the requested topic
                let result = await botFunctions.randomImage(args);
                await message.channel.send(result);
                break;
            }
            case 'add':
                await message.channel.send(botFunctions.add(args));
                break;

            case 'play':
                await message.channel.send(ytFunctions.execute(args[0], queue, serverQueue));
                return;

            case 'skip':
                //skip(message, serverQueue);
                return;

            case 'stop':
                //stop(message, serverQueue);
                return;

            default:
                // TODO: check if channelID is userID, if so: tell the bot to use !help or something
        }
    }
});

bot.login(auth.token);
