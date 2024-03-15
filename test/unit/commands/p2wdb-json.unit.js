import chai from "chai";
import sinon from "sinon";
import { promises } from "fs";
import P2WDBJson from "../../../src/commands/p2wdb-json.js";
import WalletCreate from "../../../src/commands/wallet-create.js";
import MockWallet from "../../mocks/msw-mock.js";
/*
  Unit tests for the p2wdb-json command.
*/
// Global npm libraries
const assert = chai.assert;
const fs = { promises }.promises;
const walletCreate = new WalletCreate();

// Hack to get __dirname back.
// https://blog.logrocket.com/alternatives-dirname-node-js-es-modules/
import * as url from 'url'
const __dirname = url.fileURLToPath(new URL('.', import.meta.url))
const filename = `${__dirname.toString()}/../../../.wallets/test123.json`;

describe('#p2wdb-json', () => {
    let uut;
    let sandbox;
    let mockWallet;
    before(async () => {
        await walletCreate.createWallet(filename);
    });
    beforeEach(async () => {
        sandbox = sinon.createSandbox();
        uut = new P2WDBJson();
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
                json: 'test'
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
        it('validateFlags() should throw error if json is not supplied.', () => {
            try {
                const flags = {
                    name: 'test123'
                };
                uut.validateFlags(flags);
            }
            catch (err) {
                assert.include(err.message, 'You must specify a JSON string with the -j flag.', 'Expected error message.');
            }
        });
    });
    describe('#instantiateWrite', () => {
        it('should instantiate the Write library', async () => {
            // Mock dependencies
            sandbox.stub(uut.walletUtil, 'instanceWallet').resolves(mockWallet);
            sandbox.stub(uut.walletUtil, 'getP2wdbServer').resolves('https://p2wdb.fullstack.cash');
            const flags = {
                name: 'test123'
            };
            const result = await uut.instantiateWrite(flags);
            assert.equal(result, true);
        });
        it('should catch and throw errors', async () => {
            try {
                await uut.instantiateWrite();
                assert.fail('Unexpected code path');
            }
            catch (err) {
                assert.include(err.message, 'Cannot read');
            }
        });
    });
    describe('#instantiatePin', () => {
        it('should instantiate the Pin library', async () => {
            // Mock dependencies
            // sandbox.stub(uut.walletUtil, 'instanceWallet').resolves(mockWallet)
            uut.wallet = mockWallet;
            sandbox.stub(uut.walletUtil, 'getP2wdbServer').resolves('https://p2wdb.fullstack.cash');
            const flags = {
                name: 'test123'
            };
            const result = await uut.instantiatePin(flags);
            assert.equal(result, true);
        });
        it('should catch and throw errors', async () => {
            try {
                await uut.instantiatePin();
                assert.fail('Unexpected code path');
            }
            catch (err) {
                assert.include(err.message, 'Must pass instance');
            }
        });
    });
    describe('#pinJson', () => {
        it('should post JSON and return CID', async () => {
            const flags = {
                name: 'test123'
            };
            sandbox.stub(uut.walletUtil, 'instanceWallet').resolves(mockWallet);
            await uut.instantiateWrite(flags);
            await uut.instantiatePin(flags);
            // Mock dependencies and force desired code path.
            sandbox.stub(uut.write, 'postEntry').resolves({ hash: 'hash1' });
            sandbox.stub(uut.pin, 'json').resolves('fake-cid');
            sandbox.stub(uut.pin, 'cid').resolves({ hash: 'hash2' });
            const result = await uut.pinJson({ json: '{"a": "b"}' });
            assert.equal(result, 'fake-cid');
        });
        it('should catch and throw errors', async () => {
            try {
                await uut.pinJson();
                assert.fail('Unexpected code path');
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
        it('should return a CID', async () => {
            // Mock dependencies
            sandbox.stub(uut, 'parse').returns({ flags: { name: 'test123' } });
            sandbox.stub(uut, 'validateFlags').returns();
            sandbox.stub(uut, 'pinJson').resolves('fake-cid');
            sandbox.stub(uut.walletUtil, 'instanceWallet').resolves(mockWallet);
            const result = await uut.run();
            assert.equal(result, 'fake-cid');
        });
    });
});
