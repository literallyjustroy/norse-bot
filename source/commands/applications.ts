import { Command } from '../models/command';
import { Message, MessageEmbed } from 'discord.js';
import { getDao } from '../util/database';
import { Application } from '../models/application';
import { sameAuthor } from '../util/util';
import { logger } from '../util/log';

const QUESTION_TIMEOUT = 5000; // 10 minutes
const QUESTION_LIMIT = 10; // Number of questions allowed per server

async function appTimeOut(message: Message): Promise<void> {
    await message.channel.send(`<@!${message.author.id}>, you took too long to respond`);
}

function textToEmbed(text: string): MessageEmbed {
    return new MessageEmbed()
        .setColor('#ffbf00')
        .setDescription(text);
}

/**
 * Gets the next message from the same user who sent a message, throws an error if the timeout time is reached (in ms)
 * @param message DiscordJS Message, who's author must answer a message
 * @param characterLimit Lets user know if max character limit is exceeded and will request new submission
 * @param timeout Time in milliseconds
 */
async function getResponse(message: Message, characterLimit: number, timeout?: number): Promise<Message> {
    let validAnswer: Message | undefined;

    while (!validAnswer) {
        const collected = await message.channel.awaitMessages(r => sameAuthor(r, message), {
            max: 1,
            time: timeout || QUESTION_TIMEOUT,
            errors: ['time']
        });
        const messageLength: number | undefined = collected?.first()?.content.length;
        if (messageLength && messageLength <= characterLimit) {
            validAnswer = collected.first();
        } else {
            await message.channel.send(
                textToEmbed(`❌ Your reply exceeds the ${characterLimit} character limit. Please try again.`)
                    .setColor('#ee3a18')
            );
        }
    }
    return validAnswer; // If there isn't a response the collector will error first
}

export async function newApplyMessage(command: Command, args: string[], message: Message): Promise<void> {
    const channel = message.mentions.channels?.first();
    if (channel) {
        if (channel.type === 'text' && message.guild) {
            await getDao().setApplyChannelId(message.guild, channel.id);

            // TODO: Create application message (save ID)

            await message.channel.send(`New Application Message created in <#${channel.id}> channel`);
        } else {
            await message.channel.send('Must mention a valid server text channel');
        }
    } else {
        await getDao().setApplyChannelId(message.guild!, undefined);
        await message.channel.send('New applications are no longer being polled');
    }
}

function getAppPreview(message: Message, app: Application): MessageEmbed {
    const appPreview = new MessageEmbed()
        .setColor('#ffbf00')
        .setTitle(`${message.guild!.name}'s Application for ${app.name} (@${app.roleName} role)`)
        .setThumbnail(message.guild!.iconURL() || '')
        .setDescription(`"${app.description}"`);

    let i = 1;
    app.questions.forEach(question => {
        appPreview.addField(`Question ${i}.`, question);
        i += 1;
    });

    return appPreview;
}

async function finishApplication(message: Message, app: Application): Promise<void> {
    // TODO: Preview application

    await message.channel.send(getAppPreview(message, app));

    // TODO: Put into database

}

export async function createApplication(command: Command, args: string[], message: Message): Promise<void> {
    let appFinished = false;
    try {
        await message.channel.send(textToEmbed('What is the role for this new application? (Ex: @Norse)'));
        const role = (await getResponse(message, 150)).mentions.roles.first();
        if (role) {
            await message.channel.send(textToEmbed('What is the title of this new application? (Ex: NKU Student)'));
            const title = (await getResponse(message, 100)).content;

            await message.channel.send(textToEmbed('What is the description of this new application? (Ex: Apply here if you currently attend Northern Kentucky University)'));
            const description = (await getResponse(message, 500)).content;

            // Questions

            const questions: string[] = [];

            for (let i = 1; i <= QUESTION_LIMIT && !appFinished; i++) {
                const questionEmbed = textToEmbed(`**What is question ${i}?:** (Ex: 'What is your student id number?')`);

                if (i > 1) {
                    questionEmbed.setFooter('\n✅ : Complete application');
                }
                if (i === QUESTION_LIMIT) {
                    questionEmbed.setDescription(`**What is question ${i}? (FINAL QUESTION):** `);
                }

                const botQuestion = await message.channel.send(questionEmbed);
                if (i > 1) {
                    await botQuestion.react('✅');
                    botQuestion.awaitReactions((reaction, user) => user.id === message.author.id && reaction.emoji.name === '✅', {
                        max: 1,
                        time: QUESTION_TIMEOUT
                    }).then(async reactions => {
                        if (reactions.size > 0 && !appFinished) {
                            appFinished = true;
                            await finishApplication(message, {
                                    roleId: role.id,
                                    roleName: role.name,
                                    name: title,
                                    description: description,
                                    guildId: message.guild!.id,
                                    lastModifiedById: message.author.id,
                                    questions: questions
                            });
                        }
                    });
                }

                const question = (await getResponse(message, 200)).content;
                questions.push(question);
            }
            if (!appFinished) { // If all questions finished and the for loop ends without reaction
                appFinished = true;
                await finishApplication(message, {
                    roleId: role.id,
                    roleName: role.name,
                    name: title,
                    description: description,
                    guildId: message.guild!.id,
                    lastModifiedById: message.author.id,
                    questions: questions
                });
            }
        } else {
            await message.channel.send(textToEmbed('❌ Failed to mention a valid role, restart the application creation process').setColor('#ee3a18'));
        }

    } catch(error) {
        if (error.size === 0) {
            if (!appFinished)
                await appTimeOut(message);
        } else {
            logger.error(error);
            await message.channel.send('There was an error, it has been logged.');
        }
    }
}
