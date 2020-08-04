export interface Application {
    name: string;
    description: string;
    roleId: string;
    guildId: string;
    lastModifiedById: string;
    questions: Question[];
}

export interface Question {
    question: string;
    answer: string;
    type: 'text' | 'reaction';
}