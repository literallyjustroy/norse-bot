var assert = require('assert');
const botFunctions = require('../source/functions');

describe('botFunctions', function() {
    describe('#add()', function() {
        it('Should return error message for wrong number of arguments', function() {
            const args = [];
            const message = botFunctions.add(args)
            assert.equal(message, 'Must add 2 numbers (Ex: "!add 1 2)"');
        });

        it('Should return error message if arguments aren\'t numbers', function() {
            const args = ['abc', '1'];
            const message = botFunctions.add(args)
            assert.equal(message, 'Arguments must be numbers');
        });

        it('Should return the correct addition of two string numbers', function() {
            const args = ['3', '4'];
            const message = botFunctions.add(args)
            assert.equal(message, 7);
        });
    });
});