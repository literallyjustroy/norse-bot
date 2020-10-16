<img width="150" height="150" align="left" style="float: left; margin: 0 10px 0 0;" alt="NorseBot Logo" src="https://user-images.githubusercontent.com/56088145/88754914-e9889f80-d12d-11ea-91e8-927f65f4795c.png">

# NorseBot

NorseBot is a multipurpose discord bot with uses in ticket management, moderation, fun, and streamer integrations. Click the button below to invite NorseBot to your own discord server.

[<img width="353" height="122" src="https://user-images.githubusercontent.com/56088145/88756059-84827900-d130-11ea-868b-da3cc805a16e.png">](https://discord.com/api/oauth2/authorize?client_id=667552258476736512&permissions=8&scope=bot)

## Commands
The default prefix is '**!**', however, this can be set to any prefix desired. Use `!help` to get a full list of commands, or `!help COMMAND_NAME_HERE` to get information about a specific command/feature.
Help Page 1                |  Help Page 2
:-------------------------:|:-------------------------:
![Help1](https://i.imgur.com/0Lq7Qbz.png)  |  ![Help2](https://i.imgur.com/XgTSjuh.png)

### Applications
NorseBot lets you to create applications that allow members of your discord server to apply for roles.  

#### Create an Application

First create an application for your discord members to apply to with `!app new`.  

![Application Creation](https://i.imgur.com/1T7kOPx.png)

#### Set a channel to review submitted applications in

Next set the reviewing channel with `!app reviewchannel #CHANNEL_MENTION_HERE`. This is the channel where submitted applications will reside. You will be able to either accept or decline their role request, and they will be messaged regarding the update.

![Application Review](https://i.imgur.com/yCVk7ET.png)

#### Set a channel to place the application message

Next set the application channel with `!app applychannel #CHANNEL_MENTION_HERE`. Users will be able to react in this channel to fill out the applications you create.

![Applications Preview](https://i.imgur.com/pzdXx7J.png)  

### Tickets

Discord users can create a ticket by entering `!ticket create TICKET_TITLE_HERE` in any text channel (This message is removed by NorseBot after a short delay). The first time a user creates a ticket a new Category will be setup with a ticket-logs channel. This ticket-logs channel will save the messages from a ticket once it is closed. 

![Ticket example](https://i.imgur.com/nJONhLx.png)

#### Ticket permissions

By default, the only people who can see the ticket channel created are administrators and the person who opened the ticket. If you want other users to be able to see tickets the moment they are created, modify the Tickets category permissions to include additional roles/users.

### Streaming
NorseBot lets you set up streaming notifications for members with a certain role. This requires the member has their twitch integrated with their discord; the notification will show up in the channel once discord recognizes they are streaming. 

![Streaming example](https://i.imgur.com/u0Ad00t.png)

#### Set a streaming notification channel
First set the notification channel with `!stream channel #CHANNEL_MENTION_HERE`. This is the channel where NorseBot will post links to streams when members with the streaming role start streaming.

![Streaming Preview](https://i.imgur.com/ufSdkUx.png)

#### Set a streamer role
Finally, set the stream role with `!stream role @ROLE_MENTION_HERE`. When users with this role start streaming, NorseBot will post a link to their stream in the streaming notification channel set previously. 

## Hosting this bot (For developers)
You can also host this bot in your own NodeJS Environment. When on Linux, using PM2 is highly recommended.

1. Clone this repository
2. Install NodeJS
3. Navigate to the project root directory
4. Install dependencies: `npm install` using cmd prompt/terminal
5. Define the environment variable BOT_TOKEN (containing your Build-A-Bot token)
6. Define the environment variable DB_LOGIN_URL (Example: DB_LOGIN_URL=mongodb+srv://USER:PASS@norsebot.mongodb.net)
7. Define the environment variable DB_NAME (name of the database, like dev, prod, etc.)
8. Run `npm start` in cmd prompt/terminal 

## Testing / Development

* Run `npm dev` to run the bot without compiling it into JavaScript (slightly more memory intensive)
* Run `npm test` in cmd prompt/terminal for unit testing
