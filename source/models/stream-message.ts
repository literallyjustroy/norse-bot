import { Message } from 'discord.js';

export interface StreamMessage {
    message: Message;
    streamerId: string;
    streamName: string | null;
    streamTopic: string | null;
    streamUrl: string | null;
}