import { assert } from "chai";
import { validateArgs, Validator } from "../source/util/validator";

describe('validator', () => {

    describe('#validateArgs()', () => {
        it('Should return null for too few arguments', () => {
            const args: string[] = [];
            assert.notExists(validateArgs(args, Validator.ANY, 1));
        });

        it('Should return null for too many arguments', () => {
            const args: string[] = ['a', 'b', 'c'];
            assert.notExists(validateArgs(args, Validator.ANY, 1, 2));
        });

        it('Should return empty arguments for 0 string arguments', () => {
            const args: string[] = [];
            assert.deepEqual(validateArgs(args, Validator.ANY, 0), []);
        });

        it('Should return arguments for correct number of arguments', () => {
            const args: string[] = ['a', 'b', 'c'];
            assert.deepEqual(validateArgs(args, Validator.ANY, 3, 3), ['a', 'b', 'c']);
        });


        it('Should return null for non-number arguments when numbers expected', () => {
            const args: string[] = ['1.1', 'abc'];
            assert.notExists(validateArgs(args, Validator.NUMBER));
        });

        it('Should return empty arguments for 0 string arguments', () => {
            const args: string[] = [];
            assert.deepEqual(validateArgs(args, Validator.NUMBER, 0), []);
        });

        it('Should return number arguments when string numbers given', () => {
            const args: string[] = ['1.1', '2', '0.37'];
            assert.deepEqual(validateArgs(args, Validator.NUMBER), [1.1, 2, 0.37]);
        });


        it('Should return null for string arguments when integers expected', () => {
            const args: string[] = ['abc', ' '];
            assert.notExists(validateArgs(args, Validator.INTEGER));
        });

        it('Should return null for float arguments when integers expected', () => {
            const args: string[] = ['1.1', '1.2'];
            assert.notExists(validateArgs(args, Validator.INTEGER));
        });

        it('Should return empty arguments for 0 string arguments', () => {
            const args: string[] = [];
            assert.deepEqual(validateArgs(args, Validator.INTEGER, 0), []);
        });

        it('Should return number arguments when string numbers given', () => {
            const args: string[] = ['-1', '0', '9001'];
            assert.deepEqual(validateArgs(args, Validator.INTEGER), [-1, 0, 9001]);
        });
    });
    
});