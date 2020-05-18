import { LoggerOptions } from 'winston';
import winston from 'winston';

const options = {
    console: {
        level: 'debug',
        handleExceptions: true,
        json: true,
        colorize: true,
    },
};

export const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.Console(options.console),
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' })
    ]
} as LoggerOptions);