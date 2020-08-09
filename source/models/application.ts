export interface Application {
    name: string;
    description: string;
    roleId: string;
    roleName: string;
    guildId: string;
    lastModifiedById: string;
    questions: string[];
    answers?: string[];
    applicantId?: string;
    reviewMessageId?: string;
    reviewChannelId?: string;
    _id?: string;
}