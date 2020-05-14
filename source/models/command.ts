export interface Command {
    name: string;
    description: string;
    permission: number;
    example: string;
    subCommands?: { [key: string]: Command };
}