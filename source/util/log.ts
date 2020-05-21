import winston from 'winston';
import Transport from 'winston-transport';
import { getDao } from './database';

const options = {
    console: {
        level: 'debug',
        handleExceptions: true,
        json: true,
        colorize: true,
    },
};

class MonkTransport extends Transport {

    constructor(opts: Transport.TransportStreamOptions) {
        super(opts);
    }

    async log(info: any, callback: () => void): Promise<void> {
        setImmediate(() => {
            this.emit('logged', info);
        });

        await getDao().client.db('test').collection('logs').insertOne(info);

        callback();
    }
}

export const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss'
        }),
        winston.format.json(),
        winston.format.prettyPrint()
    ),
    transports: [
        new winston.transports.Console(options.console),
        new MonkTransport({ level: 'error' }),
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' })
    ]
});