function argsToInteger(args: string[]): number[] {
    return args.map((arg: string) => {
        const parsedArg = +arg;
        if (isNaN(parsedArg) || !Number.isSafeInteger(parsedArg)) {
            throw Error('Not an Integer');
        }
        return parsedArg;
    });
}

function argsToNumber(args: string[]): number[] {
    return args.map((arg: string) => {
        const parsedArg = +arg;
        if (isNaN(parsedArg)) {
            throw Error('Not a Number');
        }
        return parsedArg;
    });
}

export enum Validator {
    ANY ,
    INTEGER,
    NUMBER
}

export function validateArgs(args: string[], argType: Validator, min?: number, max?: number): string[] | number[] | null {
    if (args && (!min || args.length >= min) && (!max || args.length <= max)) {
        try {
            switch (argType) {
                case Validator.ANY:
                    return args;
                case Validator.INTEGER:
                    return argsToInteger(args);
                case Validator.NUMBER:
                    return argsToNumber(args);
                default:
                    return null;
            }
        } catch (error) {
            return null;
        }
    }
    return null;
}