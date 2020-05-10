import { validateArgs, Validator } from "./util/validator";
import { Message } from "discord.js";
import { ping, randomImage } from "./functions";
import { logger } from "./util/log";
import { ParsedMessage } from "./models/parsed-message";

export class BotService {

    async ping(message: Message): Promise<void> {
        await message.channel.send(ping(message.createdTimestamp));
    }

    async add(args: string[], message: Message): Promise<void> {
        let response: string;
        try {
            const nums = validateArgs(args, Validator.NUMBER, 2);
            if (nums) {
                response = String(nums[0] + nums[1]);
            } else {
                response = 'Must add 2 numbers (Ex: "!add 1 2")';
            }
        } catch (error) {
            logger.error(error);
            response = `Error adding ${args}`;
        }
        await message.channel.send(response);
    }

    async getImage(args: string[], message: Message): Promise<void> {
        let response: string;
        try {
            const validArgs = validateArgs(args, Validator.ANY, 1);
            if (validArgs) {
                response = response = await randomImage(validArgs);
            } else {
                response = 'Must provide at least 1 search term (Ex: !get nku e-Sports)';
            }
        } catch (error) {
            logger.error(error);
            response = 'Error getting image';
        }
        await message.channel.send(response);
    }

}

export function parseMessage(content: string, keywordString: string): ParsedMessage {
    let args = content.substring(keywordString.length).split(' ');
    args = args.filter((arg: string) => {
        return arg.trim().length !== 0;
    });

    return { cmd: args[0], args: args.splice(1) };
}