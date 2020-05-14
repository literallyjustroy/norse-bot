import { Validator } from '../util/validator';

export interface Command {
    name: string;
    description: string;
    permission: number;
    validation?: ValidationOptions;
    example: string;
    subCommands?: { [key: string]: Command };
    execute?: Function;
}

interface ValidationOptions {
    type: Validator;
    min?: number;
    max?: number;
    message: string;
}