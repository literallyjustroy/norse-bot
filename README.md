# NorseBot

Discord Bot created for use by the NKU Esports discord.

## Running the bot

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
