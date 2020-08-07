export interface Application {
    name: string;
    description: string;
    roleId: string;
    roleName: string;
    guildId: string;
    lastModifiedById: string;
    questions: string[];
    answers?: string[];
}