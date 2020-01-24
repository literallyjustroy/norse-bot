# NorseBot

Basic Discord bot as an example to proof the testability of discord bots for use in Software Testing and Maintenance.

## Setup

1. Install NodeJS
2. Navigate to the project root directory
3. Install dependencies: `npm install discord.js winston request request-promise-native`
4. Add a auth.json file in the root directory and paste in the token (pinned in the #project channel)
5. Run `node bot.js`

## Testing

1. Install Mocha with `npm install mocha`
2. Run `npm test` (Defined in package.json under Scripts)
