import { Command } from '../models/command';
import {
    Client, DMChannel,
    Guild,
    Message,
    MessageEmbed, NewsChannel,
    TextChannel, User,
} from 'discord.js';
import { getDao } from '../util/database';
import { Application } from '../models/application';
import { logger } from '../util/log';
import {
    addReactions,
    appTimeOut, Colors,
    getResponse, optionsString,
    reactionSelect,
    sendError,
    sendSuccess,
    textToEmbed
} from '../util/util';

const QUESTION_TIMEOUT = 1800000; // 30 minutes
const QUESTION_LIMIT = 10; // Number of questions allowed per application
const GUILD_APP_LIMIT = 10; // Number of applications allowed per server
const NUMBER_EMOJI = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

function getAppHeader(guild: Guild, app: Application): MessageEmbed {
    return textToEmbed(app.description)
        .setTitle(`${guild.name}'s Application for **${app.name}** (@${app.roleName})`)
        .setThumbnail(guild.iconURL() || '')
        .setDescription(`*${app.description}*`);
}

function getAppPreview(guild: Guild, app: Application): MessageEmbed {
    const appPreview = getAppHeader(guild, app);
    
    if (app.answers) { // Include answers
        for (let i = 0; i < app.questions.length; i++){
            appPreview.addField(`${i + 1}. ${app.questions[i]}`, app.answers[i]);
        }
    } else {
        for (let i = 0; i < app.questions.length; i++){
            appPreview.addField(`${i + 1}.`, app.questions[i]);
        }
    }

    return appPreview;
}

async function collectOnAppReview(reviewMessage: Message, app: Application): Promise<void> {
    const embed = reviewMessage.embeds[0];
    if (embed && app.applicantId && app.reviewMessageId) { // Always set on review message creation anyway
        const collector = reviewMessage.createReactionCollector((reaction, user) => ['✅', '❌'].includes(reaction.emoji.name) && !user.bot);
        collector.on('collect', async (reaction, user) => {
            const guildMember = reviewMessage.guild!.members.cache.get(app.applicantId!);
            if (guildMember) {
                collector.stop();
                switch (reaction?.emoji.name) {
                    case '✅':
                        embed.setColor(Colors.Success)
                            .setTitle('**ACCEPTED** - ' + embed.title);
                        const appRole = reviewMessage.guild!.roles.cache.get(app.roleId);
                        if (appRole) {
                            await guildMember.roles.add(appRole);
                            await guildMember.send(textToEmbed(`✅ Your application for ${app.name} in *${reviewMessage.guild!.name}* has been **ACCEPTED**`).setColor(Colors.Success));
                        } else {
                            await sendError(reviewMessage.channel, `The @${app.roleName} role doesn't exist, and so wasn't applied to <@!${app.applicantId}>. However, they were still notified of their acceptance.`);
                        }
                        break;
                    case '❌':
                        embed.setColor(Colors.Failure)
                            .setTitle('**REJECTED** - ' + embed.title);
                        await guildMember.send(textToEmbed(`❌ Your application for ${app.name} in *${reviewMessage.guild!.name}* has been **REJECTED**`).setColor(Colors.Failure));
                        break;
                }
                embed.setFooter(`Reviewed by ${user.tag} on ${new Date().toDateString()}`);
                await reviewMessage.edit(embed);
                await reviewMessage.reactions.removeAll();
                await getDao().deleteActiveApplication(app.reviewMessageId!);
            } else {
                await sendError(reviewMessage.channel, 'That applicant isn\'t even in your server anymore, try again if they return');
            }
        });
    }
}

async function sendAppForReview(reviewChannel: TextChannel, user: User, app: Application): Promise<void> {
    const appPreview = getAppPreview(reviewChannel.guild, app)
        .setTitle(`${user.username} Applied for **${app.name}** (@${app.roleName})`)
        .setDescription(`**${user.tag}**\nMention:<@!${user.id}>`)
        .setColor('#ffca36');
    appPreview.thumbnail = null;
    appPreview.setFooter(optionsString([{ symbol:'✅', label:'Accept' }, { symbol:'❌', label:'Reject' }]));
    const appReviewMessage = await reviewChannel.send(appPreview);

    app.applicantId = user.id;
    app.reviewMessageId = appReviewMessage.id;
    app.reviewChannelId = reviewChannel.id;
    await getDao().uploadActiveApplication(app);

    addReactions(appReviewMessage, ['✅', '❌']); // Runs without waiting, but reactions wait in order
    await collectOnAppReview(appReviewMessage, app);
}

async function sendSetupError(user: User, guildName: string): Promise<void> {
    await user.send(textToEmbed(`❌ Server *"${guildName}"* does not have application reviewing properly setup!`).setColor(Colors.Failure));
}

function collectOnApplyMessage(applyMessage: Message): void {
    const collector = applyMessage.createReactionCollector((reaction, user) => NUMBER_EMOJI.includes(reaction.emoji.name) && !user.bot);
    collector.on('collect', async (reaction, user) => {
        const reviewChannelId = await getDao().getReviewChannelId(applyMessage.guild!);
        if (reviewChannelId) {
            const reviewChannel = applyMessage.guild!.channels.cache.get(reviewChannelId) as TextChannel;
            if (reviewChannel) {
                const emojiIndex = NUMBER_EMOJI.indexOf(reaction.emoji.name);
                const app = (await getDao().getApplications(applyMessage.guild!))[emojiIndex];

                const confirmMessage = await user.send(textToEmbed(`Would you like to start *${applyMessage.guild!.name}'s* **${app.name}** Application`));
                const confirmReaction = await reactionSelect(confirmMessage, ['✅'], QUESTION_TIMEOUT);
                if (confirmReaction) {
                    await user.send(getAppHeader(applyMessage.guild!, app));

                    app.answers = [];
                    let i = 1;
                    for (const question of app.questions) {
                        await user.send(textToEmbed(`**Question (${i}/${app.questions.length}):** ${question}`));
                        app.answers.push((await getResponse(user.dmChannel, user, 320, QUESTION_TIMEOUT)).content);
                        i += 1;
                    }
                    const appPreview = getAppPreview(applyMessage.guild!, app);
                    appPreview.setFooter(optionsString([{ symbol: '✅', label: 'Confirm' }, { symbol: '⛔', label: 'Cancel' }]));
                    const previewMessage = await user.send(appPreview);
                    reactionSelect(previewMessage, ['✅', '⛔'], QUESTION_TIMEOUT).then(async reaction => {
                        if (reaction?.emoji.name === '✅') {
                            await sendSuccess(user.dmChannel, `Application for @${app.name} submitted!`);
                            await sendAppForReview(reviewChannel, user, app);
                        } else {
                            await user.send(textToEmbed(`⛔ Application for ${app.name} canceled`).setColor('#bc1932'));
                        }
                    });
                }
            } else {
                await sendSetupError(user, applyMessage.guild!.name);
            }
        } else {
            await sendSetupError(user, applyMessage.guild!.name);
        }
    });
}

/**
 * Gets all guilds in memory and only returns ones with both applyChannelId and applyMessageId setup
 * Doesn't rely on getApplyMessage(Guild) because we need to fetch channels in the case that they are not cached
 * @param bot
 */
export async function collectAllApplyMessages(bot: Client): Promise<void> {
    const appSetupGuilds = getDao().getAppSetupGuilds();
    for (const guildMemory of appSetupGuilds) {
        const applyChannel = await bot.channels.fetch(guildMemory.applyChannelId!) as TextChannel;
        if (applyChannel) {
            const applyMessage = await applyChannel.messages.fetch(guildMemory.applyMessageId!);
            if (applyMessage) {
                await collectOnApplyMessage(applyMessage);
            }
        }
    }
}

/**
 * Gets all active applications (ones currently in review) from the database and collects reactions from them,
 * @param bot
 */
export async function collectAllActiveApps(bot: Client): Promise<void> {
    const activeApps = await getDao().getActiveApplications();
    for (const app of activeApps) {
        const reviewChannel = await bot.channels.fetch(app.reviewChannelId!) as TextChannel;
        if (reviewChannel) {
            const reviewMessage = await reviewChannel.messages.fetch(app.reviewMessageId!);
            if (reviewMessage) {
                await collectOnAppReview(reviewMessage, app);
            } else {
                await getDao().deleteActiveApplication(app.reviewMessageId!);
            }
        } else {
            await getDao().deleteActiveApplication(app.reviewMessageId!);
        }
    }
}

/**
 * Gets the ApplyMessage of a given Guild
 * @param guild
 */
async function getApplyMessage(guild: Guild): Promise<Message | undefined> {
    const applyChannelId = getDao().getApplyChannelId(guild);
    const applyMessageId = getDao().getApplyMessageId(guild);
    if (applyChannelId && applyMessageId) {
        const applyChannel = await guild.channels.cache.get(applyChannelId) as TextChannel;
        if (applyChannel) {
            return applyChannel.messages.cache.get(applyMessageId);
        }
    }
}

/**
 * Generates a new apply Message
 * @param message A Message within a guild's text channel
 * @param applyChannel
 * @param apps
 */
async function generateApplyMessage(message: Message, applyChannel: TextChannel | DMChannel | NewsChannel, apps: Application[]): Promise<Message | undefined> {
    await getDao().setApplyChannelId(message.guild!, applyChannel.id);

    const applyEmbed = textToEmbed('React with the number 🔢 associated with the application you wish to complete')
        .setTitle('Role Applications');

    let i = 0;
    apps.forEach(app => {
        applyEmbed.addField(`${NUMBER_EMOJI[i]} ${app.name}`, app.description);
        i += 1;
    });

    const applyMessage = await applyChannel.send(applyEmbed);

    for (let i = 0; i < apps.length; i++) {
        await applyMessage.react(NUMBER_EMOJI[i]);
    }

    await getDao().setApplyMessageId(message.guild!, applyMessage.id);
    collectOnApplyMessage(applyMessage);
    return applyMessage;
}

export async function newApplyMessage(command: Command, args: string[], message: Message): Promise<void> {
    const channel = message.mentions.channels?.first();
    if (channel) {
        if (channel.type === 'text' && message.guild) {
            const applyMessage = await getApplyMessage(message.guild);
            await applyMessage?.delete();

            const apps = await getDao().getApplications(message.guild!);
            if (apps.length > 0) {
                await message.channel.send(textToEmbed(`New Application Message created in <#${channel.id}> channel`));
                await generateApplyMessage(message, channel, apps);
            } else {
                await sendError(message.channel, 'You must have at least one application to generate an apply message');
            }
        } else {
            await sendError(message.channel, 'Must mention a valid server text channel');
        }
    } else {
        await getDao().setApplyChannelId(message.guild!, undefined);
        await message.channel.send(`New applications are no longer being polled. To set a application channel, mention it by name (Ex. ${getDao().getPrefix(message.guild)}${command.example})`);
    }
}

export async function setReviewChannel(command: Command, args: string[], message: Message): Promise<void> {
    const channel = message.mentions.channels?.first();
    if (channel) {
        if (channel.type === 'text' && message.guild) {
            await getDao().setReviewChannelId(message.guild, channel.id);
            await message.channel.send(textToEmbed(`<#${channel.id}> will now receive completed applications ready for review`));
        } else {
            await sendError(message.channel, 'Must mention a valid server text channel');
        }
    } else {
        await getDao().setReviewChannelId(message.guild!, undefined);
        await message.channel.send(textToEmbed(`The review channel for applications has been unset, applications can no longer be filled out. To set a review channel, mention it by name (Ex. ${getDao().getPrefix(message.guild)}${command.example})`));
    }
}

async function updateApplyMessage(message: Message): Promise<void> {
    const applyMessage = await getApplyMessage(message.guild!);
    await applyMessage?.delete();

    const applyChannelId = getDao().getApplyChannelId(message.guild!);
    if (applyChannelId) {
        const applyChannel = message.guild!.channels.cache.get(applyChannelId) as TextChannel;
        if (applyChannel) {
            const apps = await getDao().getApplications(message.guild!);
            if (apps.length > 0) {
                await generateApplyMessage(message, applyChannel, apps);
            }
        }
    }
}

async function finishApplication(message: Message, app: Application): Promise<void> {
    const appPreview = await message.channel.send(
        getAppPreview(message.guild!, app)
            .setFooter(optionsString(
                [
                    { symbol:'✅', label:'Confirm' },
                    { symbol:'⛔', label:'Cancel' }
                ]
            ))

    );
    reactionSelect(appPreview, ['✅', '⛔'], QUESTION_TIMEOUT, message.author).then(async reaction => {
        if (reaction) {
            switch (reaction.emoji.name) {
                case '✅':
                    const guildApps = await getDao().getApplications(message.guild!);
                    if (guildApps.length < GUILD_APP_LIMIT) {
                        await getDao().uploadApplication(app);
                        await sendSuccess(message.channel,`Application for <@&${app.roleId}> saved!`);
                        await updateApplyMessage(message);
                    } else {
                        await sendError(message.channel, `Failed to submit application. Your server is at the application limit of ${GUILD_APP_LIMIT}.`);
                    }
                    break;
                case '⛔':
                    await message.channel.send(textToEmbed(`⛔ Application for <@&${app.roleId}> canceled`).setColor('#bc1932'));
                    break;
                case '🔨':
                    // Unimplemented Feature
                    break;
            }
        } else {
            await appTimeOut(message);
        }
    });

}

export async function createApplication(command: Command, args: string[], message: Message): Promise<void> {
    const guildApps = await getDao().getApplications(message.guild!);
    if (guildApps.length >= GUILD_APP_LIMIT) {
        await sendError(message.channel, `Failed to create application. Your server is at the application limit of ${GUILD_APP_LIMIT}.`);
        return;
    }

    let appFinished = false;

    try {
        await message.channel.send(textToEmbed('What is the role for this new application? (Ex: @Norse)'));
        const role = (await getResponse(message.channel, message.author, 70, QUESTION_TIMEOUT)).mentions.roles.first();

        if (role) {
            await message.channel.send(textToEmbed('What is the title of this new application? (Ex: NKU Student)'));
            const title = (await getResponse(message.channel, message.author, 70, QUESTION_TIMEOUT)).content;

            await message.channel.send(textToEmbed('What is the description of this new application? (Ex: Apply here if you currently attend Northern Kentucky University)'));
            const description = (await getResponse(message.channel, message.author, 500, QUESTION_TIMEOUT)).content;

            // Questions

            const questions: string[] = [];

            for (let i = 1; i <= QUESTION_LIMIT && !appFinished; i++) {
                const questionEmbed = textToEmbed(`**What is question ${i}?**`);

                if (i === 1 ) {
                    questionEmbed.setDescription(`**What is question ${i}?** (Ex: 'What is your student id number?')`);
                } else if (i > 1) {
                    questionEmbed.setFooter('✅ - Complete application');
                } else if (i === QUESTION_LIMIT) {
                    questionEmbed.setDescription(`**What is question ${i}? (FINAL QUESTION):** `);
                }

                const botQuestion = await message.channel.send(questionEmbed);
                if (i > 1) {
                    reactionSelect(botQuestion, ['✅'], QUESTION_TIMEOUT, message.author).then(async reaction => {
                        if (reaction && !appFinished) {
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

                const question = (await getResponse(message.channel, message.author, 200, QUESTION_TIMEOUT)).content;
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
            await sendError(message.channel, 'Failed to mention a valid role, restart the application creation process');
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
