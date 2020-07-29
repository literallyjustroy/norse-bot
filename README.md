<img width="150" height="150" align="left" style="float: left; margin: 0 10px 0 0;" alt="NorseBot Logo" src="https://user-images.githubusercontent.com/56088145/88754914-e9889f80-d12d-11ea-91e8-927f65f4795c.png">

# NorseBot

NorseBot is a multipurpose discord bot with uses in ticket management, moderation, fun, and streamer integrations. Click the button below to invite NorseBot to your own discord server.

[<img width="353" height="122" src="https://user-images.githubusercontent.com/56088145/88756059-84827900-d130-11ea-868b-da3cc805a16e.png">](https://discord.com/api/oauth2/authorize?client_id=667552258476736512&permissions=8&scope=bot)

## Commands
The default prefix is '**!**', however, this can be set to any prefix desired. Use **!help** to get a full list of commands
Help Page 1                |  Help Page 2
:-------------------------:|:-------------------------:
![](https://user-images.githubusercontent.com/56088145/88757040-22774300-d133-11ea-9766-f4e72700e136.png)  |  ![](https://user-images.githubusercontent.com/56088145/88757222-8994f780-d133-11ea-8718-5bba69be6e12.png)

## Hosting this bot
You can also host this bot in your own NodeJS Environment. Using PM2 on Linux is highly recommended.

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
