import { assert } from 'chai';
import { argsToString, parseMessage } from '../bot-service';

describe('bot-service', () => {

    describe('#parseMessage()', () => {
        it('Should return correct command and args given odd spacing', async () => {
            const message = '! 1 2';
            const parsedMessage = parseMessage(message, '!');
            const [cmd, args] = [parsedMessage.cmd, parsedMessage.args];
            assert.strictEqual(cmd, '1');
            assert.deepEqual(args, ['2']);
        });

        it('Should return correct command and args given no arguments', async () => {
            const message = '!test';
            const parsedMessage = parseMessage(message, '!');
            const [cmd, args] = [parsedMessage.cmd, parsedMessage.args];
            assert.strictEqual(cmd, 'test');
            assert.deepEqual(args, []);
        });

        it('Should return correct command and args given no command or arguments', async () => {
            const message = '!';
            const parsedMessage = parseMessage(message, '!');
            const [cmd, args] = [parsedMessage.cmd, parsedMessage.args];
            assert.notExists(cmd);
            assert.deepEqual(args, []);
        });

        it('Should return correct command and args given normal message', async () => {
            const message = '!add 1 2';
            const parsedMessage = parseMessage(message, '!');
            const [cmd, args] = [parsedMessage.cmd, parsedMessage.args];
            assert.strictEqual(cmd, 'add');
            assert.deepEqual(args, ['1', '2']);
        });

        it('Should return correct command and args given oddly formatted message', async () => {
            const message = '!testWord 1    2 4';
            const parsedMessage = parseMessage(message, '!');
            const [cmd, args] = [parsedMessage.cmd, parsedMessage.args];
            assert.strictEqual(cmd, 'testWord');
            assert.deepEqual(args, ['1', '2', '4']);
        });
    });

    describe('#argsToString()', () => {
        it('Should return correct string from list of string args', async () => {
            const args = ['command', '1', '2'];
            assert.strictEqual(argsToString(args), '1 2');
        });

        it('Should return empty string from list of single arg (command)', async () => {
            const args = ['command'];
            assert.strictEqual(argsToString(args), '');
        });

        it('Should return empty string from empty list of args', async () => {
            const args: string[] = [];
            assert.strictEqual(argsToString(args), '');
        });
    });

});