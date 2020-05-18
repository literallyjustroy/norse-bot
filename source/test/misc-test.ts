import { assert } from 'chai';
import { randomImage } from '../commands/misc';

describe('misc', function() {

    describe('#randomImage()', function() {
        it('Should return error message for wrong number of arguments', async () => {
            const args: string[] = [];
            const message = await randomImage(args);
            assert.strictEqual(message, 'Error getting requested image');
        });

        it('Should return error message for no results for too specific args', async () => {
            const args = ['zwmdmzfiioetjamfam123192390djasjikda', 'zc9i9i238u8udjdsaf8988'];
            const message = await randomImage(args);
            assert.strictEqual(message, 'Search returned no results');
        });

        it('Should return results for symbol arguments', async () => {
            const args = ['-/.!@#$)(*&^%'];
            const message = await randomImage(args);
            assert.include(message, 'http://');
        });

        it('Should return a website address', async () => {
            const args = ['dog', 'party'];
            const message = await randomImage(args);
            assert.include(message, 'http://');
        });
    });

});