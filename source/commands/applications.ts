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
    appTimeOut, Colors, getOptionalRole,
    getResponse, optionsString,
    reactionSelect, safeFetch,
    sendError,
    sendSuccess,
    textToEmbed
} from '../util/util';

const QUESTION_TIMEOUT = 1800000; // 30 minutes
const QUESTION_LIMIT = 10; // Number of questions allowed per application
const GUILD_APP_LIMIT = 10; // Number of applications allowed per server
const NUMBER_EMOJI = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

function getAppHeader(guild: Guild, app: Application): MessageEmbed {
    let desc = `*${app.description}*`;
    if (app.prereqRoleId) {
        desc += `\n**Requires:** @${app.prereqRoleName}`;
    }
    if (app.removalRoleId) {
        desc += `\n**Removes:** @${app.removalRoleName}`;
    }
    return textToEmbed('')
        .setTitle(`${guild.name}'s application for **${app.name}** (@${app.roleName})`)
        .setThumbnail(guild.iconURL() || '')
        .setDescription(desc);
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
                            try {
                                await guildMember.roles.add(appRole);
                                if (app.removalRoleId) {
                                    await guildMember.roles.remove(app.removalRoleId);
                                }
                            } catch {
                                await sendError(reviewMessage.channel, `The @${app.roleName} role is higher in the Role hierarchy than this bot's highest role, and so wasn't applied to <@!${app.applicantId}>. However, they were still notified of their acceptance`);
                            }
                        } else {
                            await sendError(reviewMessage.channel, `The @${app.roleName} role doesn't exist, and so wasn't applied to <@!${app.applicantId}>. However, they were still notified of their acceptance`);
                        }
                        await guildMember.send(textToEmbed(`✅ Your application for ${app.name} in *${reviewMessage.guild!.name}* has been **ACCEPTED**`).setColor(Colors.Success));
                        break;
                    case '❌':
                        embed.setColor(Colors.Failure)
                            .setTitle('**REJECTED** - ' + embed.title);
                        await guildMember.send(textToEmbed(`❌ Your application for ${app.name} in *${reviewMessage.guild!.name}* has been **REJECTED**`).setColor(Colors.Failure));
                        break;
                }
                embed.setFooter(`Reviewed by ${user.tag} on ${new Date().toDateString()}`);
                await reviewMessage.edit(embed);
                await getDao().deleteActiveApplication(app.reviewMessageId!);
                await reviewMessage.reactions.removeAll();

                const archiveChannelId = getDao().getArchiveChannelId(reviewMessage.guild!);
                if (archiveChannelId) {
                    const archiveChannel = reviewMessage.guild!.channels.cache.get(archiveChannelId) as TextChannel;
                    if (archiveChannel) {
                        await archiveChannel.send(embed);
                    }
                }
            } else {
                await sendError(reviewMessage.channel, 'That applicant isn\'t even in your server anymore, try again if they return');
            }
        });
    }
}

async function sendAppForReview(reviewChannel: TextChannel, user: User, app: Application): Promise<void> {
    let desc = `**${user.tag}**\nMention: <@!${user.id}>\nRole: <@&${app.roleId}>`;
    const appPreview = getAppPreview(reviewChannel.guild, app)
        .setTitle(`${user.username} applied for **${app.name}** (@${app.roleName})`)
        .setColor('#ffca36');
    if (app.prereqRoleId) {
        desc += `\nRequires: <@&${app.prereqRoleId}>`;
    }
    if (app.removalRoleId) {
        desc += `\nRemoves: <@&${app.removalRoleId}>`;
    }
    appPreview.setDescription(desc);
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
        await reaction.users.remove(user);
        const reviewChannelId = await getDao().getReviewChannelId(applyMessage.guild!);
        if (reviewChannelId) {
            const reviewChannel = applyMessage.guild!.channels.cache.get(reviewChannelId) as TextChannel;
            if (reviewChannel) {
                const emojiIndex = NUMBER_EMOJI.indexOf(reaction.emoji.name);
                const app = (await getDao().getApplications(applyMessage.guild!))[emojiIndex];

                const guildMember = applyMessage.guild!.members.cache.get(user.id);
                if (!app.prereqRoleId || (app.prereqRoleId && guildMember && guildMember.roles.cache.get(app.prereqRoleId))) {
                    const confirmMessage = await user.send(textToEmbed(`Would you like to start *${applyMessage.guild!.name}'s* **${app.name}** Application`));
                    const confirmReaction = await reactionSelect(confirmMessage, ['✅'], QUESTION_TIMEOUT);
                    if (confirmReaction) {
                        await user.send(getAppHeader(applyMessage.guild!, app));

                        app.answers = [];
                        let i = 1;
                        for (const question of app.questions) {
                            await user.send(textToEmbed(`**Question (${i}/${app.questions.length}):** ${question}`));
                            try {
                                app.answers.push((await getResponse(user.dmChannel, user, 320, QUESTION_TIMEOUT)).content);
                            } catch(error) {
                                return await appTimeOut(user.dmChannel, user);
                            }
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
                    await user.send(textToEmbed(`❌ You do not have the prerequisite role @${app.prereqRoleName} required to apply for ${app.name}.`).setColor(Colors.Failure));
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
        const applyChannel = await safeFetch(bot.channels, guildMemory.applyChannelId!) as TextChannel;
        if (applyChannel) {
            const applyMessage = await safeFetch(applyChannel.messages, guildMemory.applyMessageId!);
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
        const reviewChannel = await safeFetch(bot.channels, app.reviewChannelId!) as TextChannel;
        if (reviewChannel) {
            const reviewMessage = await safeFetch(reviewChannel.messages, app.reviewMessageId!);
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
 * @param guild
 * @param applyChannel
 * @param apps
 */
async function generateApplyMessage(guild: Guild, applyChannel: TextChannel | DMChannel | NewsChannel, apps: Application[]): Promise<Message | undefined> {
    await getDao().setApplyChannelId(guild, applyChannel.id);

    const applyEmbed = textToEmbed('React with the number 🔢 associated with the application you wish to complete')
        .setTitle('Role Applications');

    let i = 0;
    apps.forEach(app => {
        let desc = app.description;
        if (app.prereqRoleId) {
            desc = `**Requires:** <@&${app.prereqRoleId}>\n` + desc;
        }
        applyEmbed.addField(`${NUMBER_EMOJI[i]} ${app.name}`, desc);
        i += 1;
    });

    const applyMessage = await applyChannel.send(applyEmbed);

    for (let i = 0; i < apps.length; i++) {
        await applyMessage.react(NUMBER_EMOJI[i]);
    }

    await getDao().setApplyMessageId(guild, applyMessage.id);
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
                await generateApplyMessage(message.guild!, channel, apps);
            } else {
                await sendError(message.channel, 'You must have at least one application to generate an apply message');
            }
        } else {
            await sendError(message.channel, 'Must mention a valid server text channel');
        }
    } else {
        const applyMessage = await getApplyMessage(message.guild!);
        await applyMessage?.delete();
        await getDao().setApplyChannelId(message.guild!, undefined);
        await getDao().setApplyMessageId(message.guild!, undefined);
        await message.channel.send(textToEmbed(`New applications are no longer being polled. To set a application channel, mention it by name (Ex. ${getDao().getPrefix(message.guild)}${command.example})`));
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

export async function setArchiveChannel(command: Command, args: string[], message: Message): Promise<void> {
    const channel = message.mentions.channels?.first();
    if (channel) {
        if (channel.type === 'text' && message.guild) {
            await getDao().setArchiveChannelId(message.guild, channel.id);
            await message.channel.send(textToEmbed(`<#${channel.id}> will now receive applications after they have been submitted and reviewed`));
        } else {
            await sendError(message.channel, 'Must mention a valid server text channel');
        }
    } else {
        await getDao().setArchiveChannelId(message.guild!, undefined);
        await message.channel.send(textToEmbed('The application archive channel has been unset, applications can no longer be archived here after review'));
    }
}

async function updateApplyMessage(guild: Guild): Promise<void> {
    const applyMessage = await getApplyMessage(guild);
    await applyMessage?.delete();

    const applyChannelId = getDao().getApplyChannelId(guild);
    if (applyChannelId) {
        const applyChannel = guild.channels.cache.get(applyChannelId) as TextChannel;
        if (applyChannel) {
            const apps = await getDao().getApplications(guild);
            if (apps.length > 0) {
                await generateApplyMessage(guild, applyChannel, apps);
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
                        await updateApplyMessage(message.guild!);
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
            await appTimeOut(message.channel, message.author);
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
        const guildMember = message.guild!.member(message.author)!;

        if (role) {
            if (guildMember.hasPermission('ADMINISTRATOR') || guildMember.roles.highest.comparePositionTo(role) >= 0) {
                const botGuildMember = message.guild!.members.cache.get(message.client.user?.id!);
                if (botGuildMember && (botGuildMember.hasPermission('ADMINISTRATOR') || botGuildMember.roles.highest.comparePositionTo(role) >= 0)) {
                    const removalRole = await getOptionalRole('What role should be removed once the application is accepted? (Ex: @Community, or enter "none" if one isn\'t required)', message.channel, message.author, QUESTION_TIMEOUT);
                    if (!removalRole || (removalRole && guildMember.roles.highest.comparePositionTo(removalRole) >= 0)) {
                        const prereqRole = await getOptionalRole('What is the prerequisite role required to apply to this application? (Ex: @Norse, or enter "none" if one isn\'t required)', message.channel, message.author, QUESTION_TIMEOUT);

                        await message.channel.send(textToEmbed('What is the title of this new application? (Ex: NKU Student)'));
                        const title = (await getResponse(message.channel, message.author, 70, QUESTION_TIMEOUT)).content;

                        await message.channel.send(textToEmbed('What is the description of this new application? (Ex: Apply here if you currently attend Northern Kentucky University)'));
                        const description = (await getResponse(message.channel, message.author, 500, QUESTION_TIMEOUT)).content;

                        // Questions

                        const questions: string[] = [];
                        let botLastQuestion;

                        for (let i = 1; i <= QUESTION_LIMIT && !appFinished; i++) {
                            const questionEmbed = textToEmbed(`**What is question ${i}?**`);

                            if (i === 1) {
                                questionEmbed.setDescription(`**What is question ${i}?** (Ex: 'What is your student id number?')`);
                            } else if (i > 1) {
                                if (botLastQuestion)
                                    await botLastQuestion.reactions.removeAll();
                                questionEmbed.setFooter('✅ - Complete application');
                            } else if (i === QUESTION_LIMIT) {
                                questionEmbed.setDescription(`**What is question ${i}? (FINAL QUESTION):** `);
                            }

                            botLastQuestion = await message.channel.send(questionEmbed);
                            if (i > 1) {
                                questionEmbed.setFooter('✅ - Complete application');
                                reactionSelect(botLastQuestion, ['✅'], QUESTION_TIMEOUT, message.author).then(async reaction => {
                                    if (reaction && !appFinished) {
                                        appFinished = true;
                                        await finishApplication(message, {
                                            roleId: role.id,
                                            roleName: role.name,
                                            prereqRoleId: prereqRole?.id,
                                            prereqRoleName: prereqRole?.name,
                                            removalRoleId: removalRole?.id,
                                            removalRoleName: removalRole?.name,
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
                            if (!appFinished) {
                                questions.push(question);
                            }
                        }

                        if (!appFinished) { // If all questions finished and the for loop ends without reaction
                            appFinished = true;
                            await finishApplication(message, {
                                roleId: role.id,
                                roleName: role.name,
                                name: title,
                                prereqRoleId: prereqRole?.id,
                                prereqRoleName: prereqRole?.name,
                                removalRoleId: removalRole?.id,
                                removalRoleName: removalRole?.name,
                                description: description,
                                guildId: message.guild!.id,
                                lastModifiedById: message.author.id,
                                questions: questions
                            });
                        }
                    } else {
                        await sendError(message.channel, 'Cannot create an application that removes a role higher than your own (Check the role hierarchy in Server Settings)');
                    }
                } else {
                    await sendError(message.channel, `The @${role.name} role is higher in the Role hierarchy than this bot's highest role. Roles can only be applied if they are lower than the bot's highest role in Server Settings > Roles`);
                }
            } else {
                await sendError(message.channel, 'Cannot create an application for a role higher than your own (Check the role hierarchy in Server Settings)');
            }
        } else {
            await sendError(message.channel, 'Failed to mention a valid role, restart the application creation process');
        }

    } catch(error) {
        if (error.size === 0) {
            if (!appFinished)
                await appTimeOut(message.channel, message.author);
        } else {
            logger.error(error);
            await message.channel.send('There was an error, it has been logged.');
        }
    }
}

export async function deleteApplication(command: Command, args: string[], message: Message): Promise<void> {
    const apps = await getDao().getApplications(message.guild!);
    if (apps.length > 0) {
        const deleteEmbed = new MessageEmbed()
            .setTitle('Application DELETION Menu')
            .setDescription('React with the number 🔢 associated with the application you wish to **DELETE**')
            .setColor(Colors.Failure);

        let i = 0;
        apps.forEach(app => {
            deleteEmbed.addField(`${NUMBER_EMOJI[i]} ${app.name}`, app.description);
            i += 1;
        });

        const deleteMessage = await message.channel.send(deleteEmbed);
        const deleteReaction = await reactionSelect(deleteMessage, NUMBER_EMOJI.slice(0, apps.length), QUESTION_TIMEOUT, message.author);
        if (deleteReaction) {
            const emojiIndex = NUMBER_EMOJI.indexOf(deleteReaction.emoji.name);
            const app = (await getDao().getApplications(message.guild!))[emojiIndex];

            const confirmEmbed = textToEmbed(`Would you like to delete the ${app.name} (<@&${app.roleId}>) Application **(This cannot be undone)**`)
                .setFooter(optionsString(
                    [
                        { symbol:'🗑️', label:'Delete' },
                        { symbol:'❌', label:'Cancel' }
                    ]
                ));
            const confirmMessage = await message.channel.send(confirmEmbed);

            const confirmReaction = await reactionSelect(confirmMessage, ['🗑️', '❌'], QUESTION_TIMEOUT, message.author);
            if (confirmReaction) {
                switch(confirmReaction.emoji.name) {
                    case '🗑️':
                        const deleteConfirmEmbed = textToEmbed(`🗑️ **${app.name}** Application deleted by <@!${message.author.id}>!`)
                            .setColor('#99a9b4');
                        await message.channel.send(deleteConfirmEmbed);
                        await getDao().deleteApplication(app._id);

                        const applyMessage = getApplyMessage(message.guild!);
                        if (applyMessage) {
                            await updateApplyMessage(message.guild!);
                        }
                        break;
                    case '❌':
                        await sendError(message.channel, `Application Deletion canceled by <@!${message.author.id}>`);
                        break;
                }
                await deleteMessage.delete();
                await confirmMessage.delete();
            }
        }
    }
}