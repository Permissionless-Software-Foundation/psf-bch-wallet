import chai from "chai";
import sinon from "sinon";
import { promises } from "fs";
import VoteAirdrop from "../../../src/commands/vote-airdrop.js";
import WalletCreate from "../../../src/commands/wallet-create.js";
import MockWallet from "../../mocks/msw-mock.js";
/*
  Unit tests for the vote-airdrop command
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

describe('#vote-airdrop', () => {
    let uut;
    let sandbox;
    let mockWallet;
    before(async () => {
        await walletCreate.createWallet(filename);
    });
    beforeEach(async () => {
        sandbox = sinon.createSandbox();
        uut = new VoteAirdrop();
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
                addrs: 'abc',
                tokenId: 'cde'
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
        it('validateFlags() should throw error if addrs is not supplied.', () => {
            try {
                const flags = { name: 'test' };
                uut.validateFlags(flags);
            }
            catch (err) {
                assert.include(err.message, 'You must specify a list of addresses with the -a flag.', 'Expected error message.');
            }
        });
        it('validateFlags() should throw error if tokenId is not supplied.', () => {
            try {
                const flags = { name: 'test', addrs: 'abc' };
                uut.validateFlags(flags);
            }
            catch (err) {
                assert.include(err.message, 'You must specify a Token ID with the -t flag.', 'Expected error message.');
            }
        });
    });
    describe('#instantiateWallet', () => {
        it('should instantiate the wallet', async () => {
            // Mock dependencies
            sandbox.stub(uut.walletUtil, 'instanceWallet').resolves(mockWallet);
            // sandbox.stub(uut.walletUtil, 'getP2wdbServer').resolves('https://p2wdb.fullstack.cash')
            const flags = {
                name: 'test123'
            };
            const result = await uut.instantiateWallet(flags);
            assert.equal(result, true);
        });
        it('should catch and throw errors', async () => {
            try {
                await uut.instantiateWallet();
                assert.fail('Unexpected code path');
            }
            catch (err) {
                assert.include(err.message, 'Cannot read');
            }
        });
    });
    describe('#airdrop', () => {
        it('should should send tokens to addresses', async () => {
            const flags = {
                name: 'test123',
                addrs: '["a"]',
                tokenId: 'b'
            };
            // await uut.instantiateWallet(flags)
            uut.wallet = mockWallet;
            // Mock dependencies and force desired code path.
            sandbox.stub(uut.wallet, 'sendTokens').resolves('fake-txid');
            sandbox.stub(uut.wallet.bchjs.Util, 'sleep').resolves();
            sandbox.stub(uut.wallet, 'initialize').resolves();
            const result = await uut.airdrop(flags);
            assert.equal(result, true);
        });
        it('should catch and throw errors', async () => {
            try {
                await uut.airdrop();
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
        it('should return true after successful execution', async () => {
            // Mock dependencies and force desired code path.
            sandbox.stub(uut, 'parse').returns({ flags: { name: 'test123', addrs: '["a"]', tokenId: 'b' } });
            sandbox.stub(uut, 'validateFlags').returns();
            sandbox.stub(uut.walletUtil, 'instanceWallet').resolves(mockWallet);
            sandbox.stub(uut, 'airdrop').resolves();
            const result = await uut.run();
            assert.equal(result, true);
        });
    });
});
