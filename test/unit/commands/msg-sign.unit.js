import chai from "chai";
import sinon from "sinon";
import { promises } from "fs";
import MsgSign from "../../../src/commands/msg-sign.js";
import WalletCreate from "../../../src/commands/wallet-create.js";
import MockWallet from "../../mocks/msw-mock.js";
/*
  Unit tests for the msg-sign command.
*/
const assert = chai.assert;
const fs = { promises }.promises;
const walletCreate = new WalletCreate();
const filename = `${__dirname.toString()}/../../../.wallets/test123.json`;
describe('#msg-sign', () => {
    let uut;
    let sandbox;
    let mockWallet;
    before(async () => {
        await walletCreate.createWallet(filename);
    });
    beforeEach(async () => {
        sandbox = sinon.createSandbox();
        uut = new MsgSign();
        mockWallet = new MockWallet();
    });
    afterEach(() => {
        sandbox.restore();
    });
    after(async () => {
        await fs.rm(filename);
    });
    describe('#validateFlags()', () => {
        it('validateFlags() should return true.', () => {
            const flags = {
                name: 'test123',
                msg: 'test'
            };
            assert.equal(uut.validateFlags(flags), true, 'return true');
        });
        it('validateFlags() should throw error if name is not supplied.', () => {
            try {
                const flags = {};
                uut.validateFlags(flags);
            }
            catch (err) {
                assert.include(err.message, 'You must specify a wallet with the -n flag.', 'Expected error message.');
            }
        });
        it('validateFlags() should throw error if data is not supplied.', () => {
            try {
                const flags = {
                    name: 'test123'
                };
                uut.validateFlags(flags);
            }
            catch (err) {
                assert.include(err.message, 'You must specify a cleartext message to sign with the -m flag.', 'Expected error message.');
            }
        });
    });
    describe('#sign', () => {
        it('should sign a message', async () => {
            // Mock dependencies
            sandbox.stub(uut.walletUtil, 'instanceWallet').resolves(mockWallet);
            const flags = {
                name: 'test123',
                msg: 'test'
            };
            const result = await uut.sign(flags);
            // console.log(`result: ${JSON.stringify(result, null, 2)}`)
            // Assert that expected properties exist in the output.
            assert.property(result, 'signature');
            assert.property(result, 'bchAddr');
            assert.property(result, 'msg');
            assert.equal(result.signature, 'H/kNEApLOLHrrghSWsgd9o/pnG110abHVZ9Eo8+tKXueIOoA0ovZnNxuhzL1aW1JRE4My7KQMYvfrVkqpBSszKc=');
        });
        it('should catch and throw an error', async () => {
            try {
                await uut.sign();
                assert.fail('Unexpected result');
            }
            catch (err) {
                assert.include(err.message, 'Cannot read');
            }
        });
    });
    describe('#run()', () => {
        it('should return 0 and display error.message on empty flags', async () => {
            sandbox.stub(uut, 'parse').returns({ flags: {} });
            const result = await uut.run();
            assert.equal(result, 0);
        });
        it('should return true on successful execution', async () => {
            // Mock dependencies and force desired code path
            sandbox.stub(uut.walletUtil, 'instanceWallet').resolves(mockWallet);
            // Mock dependencies
            sandbox.stub(uut, 'parse').returns({
                flags: {
                    name: 'test123',
                    msg: 'test'
                }
            });
            const result = await uut.run();
            assert.equal(result, true);
        });
    });
});
