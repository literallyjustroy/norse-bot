export interface GuildMemory {
    id: string;
    name: string;
    owner?: string;
    prefix: string;
    adminRoleId?: string;

    ticketLogId?: string;

    streamChannelId?: string;
    streamRoleId?: string;

    applyChannelId?: string;
    reviewChannelId?: string;

    applyMessageId?: string;
    archiveChannelId?: string;
}