import { LoggerOptions } from "winston";
import winston from "winston";

// define the custom settings for each transport (file, console)
const options = {
    console: {
        level: 'debug',
        handleExceptions: true,
        json: true,
        colorize: true,
    },
};

// instantiate a new Winston Logger with the settings defined above
export const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    defaultMeta: { service: 'user-service' },
    transports: [
        new winston.transports.Console(options.console)
    ]
} as LoggerOptions);