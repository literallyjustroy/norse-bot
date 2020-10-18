export interface Application {
    name: string;
    description: string;
    roleId: string;
    roleName: string;
    prereqRoleId?: string;
    prereqRoleName?: string;
    removalRoleId?: string;
    removalRoleName?: string;
    guildId: string;
    lastModifiedById: string;
    questions: string[];
    answers?: string[];
    applicantId?: string;
    reviewMessageId?: string;
    reviewChannelId?: string;
    _id?: string;
}