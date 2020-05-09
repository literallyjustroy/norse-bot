const assert = require('assert');
import { add, randomImage, ping } from '../source/functions';

describe('botFunctions', function() {
    describe('#add()', function() {
        it('Should return error message for wrong number of arguments', function() {
            const args: string[] = [];
            const message = add(args);
            assert.strictEqual(message, 'Must add 2 numbers (Ex: "!add 1 2)"');
        });

        it('Should return error message if arguments aren\'t numbers', function() {
            const args = ['abc', '1'];
            const message = add(args);
            assert.strictEqual(message, 'Arguments must be numbers');
        });

        it('Should return the correct addition of two string numbers', function() {
            const args = ['3', '4'];
            const message = add(args);
            assert.strictEqual(message, '7');
        });
    });

    describe('#randomImage()', function() {
        it('Should return error message for wrong number of arguments', async function() {
            const args: string[] = [];
            const message = await randomImage(args);
            assert.strictEqual(message, 'Must provide at least 1 search term (Ex: !get nku esports)');
        });

        it('Should return error message for no results', async function() {
            const args = ['zwmdmzfiioetjamfam123192390djasjikda', 'zc9i9i238u8udjdsaf8988'];
            const message = await randomImage(args);
            assert.strictEqual(message, 'Search returned no results');
        });

        it('Should return a website address', async function() {
            const args = ['dog', 'party'];
            const message = await randomImage(args);
            assert.strictEqual(message.substring(0, 7), 'http://');
        });
    });
});