import chai from "chai";
import sinon from "sinon";
import { promises } from "fs";
import MCP2wdbUpdateTx from "../../../src/commands/mc-p2wdb-update-tx.js";
import WalletCreate from "../../../src/commands/wallet-create.js";
import MockWallet from "../../mocks/msw-mock.js";
/*
  Unit tests for the mc-p2wdb-update-tx command.
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

describe('#mc-p2wdb-update-tx', () => {
    let uut;
    let sandbox;
    let mockWallet;
    before(async () => {
        await walletCreate.createWallet(filename);
    });
    beforeEach(async () => {
        sandbox = sinon.createSandbox();
        uut = new MCP2wdbUpdateTx();
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
                txid: 'test'
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
    });
    describe('#instantiateWallet', () => {
        it('should instantiate the wallet', async () => {
            // Mock dependencies and force desired code path
            sandbox.stub(uut.walletUtil, 'instanceWallet').resolves(mockWallet);
            const flags = { name: 'test123' };
            const result = await uut.instantiateWallet(flags);
            assert.property(result, 'bchjs');
        });
        it('should catch and throw errors', async () => {
            try {
                await uut.instantiateWallet();
                assert.fail('Unexpected code path');
            }
            catch (err) {
                assert.include(err.message, 'Cannot destructure');
            }
        });
    });
    describe('#getPublicKeys', () => {
        it('should retrieve the public keys for each NFT holder', async () => {
            // Mock dependencies and force desired code path.
            sandbox.stub(uut.mcCollectKeys, 'instanceWallet').resolves();
            sandbox.stub(uut.mcCollectKeys, 'getNftsFromGroup').resolves(['fb707a9d8a4d6ba47ef0c510714ca46d4523cd29c8f4e3fd6a63a85edb8b05d2']);
            sandbox.stub(uut.mcCollectKeys, 'getAddrs').resolves(['bitcoincash:qzwahhjldv0qsecfxlmcenzvkjv9rlv9au2hcfggl6']);
            sandbox.stub(uut.mcCollectKeys, 'findKeys').resolves({
                keys: [{
                        addr: 'bitcoincash:qzwahhjldv0qsecfxlmcenzvkjv9rlv9au2hcfggl6',
                        pubKey: '02055962631b236ddcd2c17cd0b711f12438b93bcf01b206cadb351cc3e6e3e269'
                    }],
                keysNotFound: []
            });
            const result = await uut.getPublicKeys();
            // console.log('result: ', result)
            assert.isArray(result);
            assert.equal(result[0].addr, 'bitcoincash:qzwahhjldv0qsecfxlmcenzvkjv9rlv9au2hcfggl6');
            assert.equal(result[0].pubKey, '02055962631b236ddcd2c17cd0b711f12438b93bcf01b206cadb351cc3e6e3e269');
        });
        it('should catch and throw errors', async () => {
            try {
                // Mock dependencies and force desired code path
                sandbox.stub(uut.mcCollectKeys, 'instanceWallet').rejects(new Error('test error'));
                await uut.getPublicKeys();
                assert.fail('Unexpected code path');
            }
            catch (err) {
                assert.include(err.message, 'test error');
            }
        });
    });
    describe('#createMultisigWallet', () => {
        it('should create a multisig wallet', async () => {
            // Mock data
            const keyPairs = [
                {
                    addr: 'bitcoincash:qzwahhjldv0qsecfxlmcenzvkjv9rlv9au2hcfggl6',
                    pubKey: '02055962631b236ddcd2c17cd0b711f12438b93bcf01b206cadb351cc3e6e3e269'
                },
                {
                    addr: 'bitcoincash:qpr7znqfy90dqqs6rfrgwdy79h84sg5wkc89xxm2yp',
                    pubKey: '03112d4f9ad99e5866fdb72b0cf58683bd24e3e22734263e67b6b44aa5aab3a869'
                }
            ];
            const result = uut.createMultisigWallet(keyPairs);
            // console.log('result: ', result)
            assert.property(result, 'address');
            assert.property(result, 'scriptHex');
            assert.equal(result.publicKeys.length, 2);
            assert.equal(result.requiredSigners, 2);
        });
        it('should catch and throw errors', async () => {
            try {
                await uut.createMultisigWallet();
                assert.fail('Unexpected code path');
            }
            catch (err) {
                assert.include(err.message, 'Cannot read');
            }
        });
    });
    describe('#instanceLibs', () => {
        it('should instance the needed libraries', async () => {
            sandbox.stub(uut.walletUtil, 'instanceWallet').resolves(mockWallet);
            const flags = { name: 'test123' };
            await uut.instantiateWallet(flags);
            // Mock dependencies and force desired code path
            sandbox.stub(uut.walletUtil, 'instanceMsgLib').returns();
            sandbox.stub(uut.walletUtil, 'getP2wdbServer').returns();
            sandbox.stub(uut.walletUtil, 'getPinServer').returns();
            const result = uut.instanceLibs();
            assert.equal(result, true);
        });
    });
    describe('#calcP2wdbWritePrice', () => {
        it('should calculate the cost of one penny of PSF tokens', async () => {
            // Mock dependencies and force desired code path
            sandbox.stub(uut.axios, 'get').resolves({ data: { usdPerToken: 0.1235644 } });
            sandbox.stub(uut.walletUtil, 'instanceWallet').resolves(mockWallet);
            const flags = { name: 'test123' };
            await uut.instantiateWallet(flags);
            const result = await uut.calcP2wdbWritePrice();
            assert.equal(result, 0.08092945);
        });
        it('should catch and throw errors', async () => {
            try {
                await uut.calcP2wdbWritePrice();
                assert.fail('Unexpected code path');
            }
            catch (err) {
                assert.include(err.message, 'Cannot read');
            }
        });
    });
    describe('#uploadDataToIpfs', () => {
        it('should update data to IPFS', async () => {
            // Mock dependencies and force desired code path
            uut.write = {
                postEntry: async () => { return { hash: 'ztest' }; }
            };
            uut.pin = {
                json: async () => 'testCid',
                cid: async () => 'fakePinResult'
            };
            const keys = [];
            const walletObj = {};
            const p2wdbWritePrice = 0.08092945;
            const result = await uut.uploadDataToIpfs({ keys, walletObj, p2wdbWritePrice });
            console.log('result: ', result);
            assert.equal(result, 'testCid');
        });
        it('should catch and throw errors', async () => {
            try {
                await uut.uploadDataToIpfs();
                assert.fail('Unexpected code path');
            }
            catch (err) {
                assert.include(err.message, 'Cannot read');
            }
        });
    });
    describe('#writeCidToBlockchain', () => {
        it('should write the CID to the BCH blockchain', async () => {
            // Mock dependencies and force desired code path
            uut.wallet = {
                initialize: async () => { },
                sendOpReturn: async () => { return 'fakeTxid'; }
            };
            const result = await uut.writeCidToBlockchain('fakeCid');
            assert.equal(result, 'fakeTxid');
        });
        it('should catch and throw errors', async () => {
            try {
                await uut.writeCidToBlockchain();
                assert.fail('Unexpected code path');
            }
            catch (err) {
                assert.include(err.message, 'Cannot read');
            }
        });
    });
    describe('#run', () => {
        it('should return true on successful execution', async () => {
            // Mock dependencies and force desired code path
            sandbox.stub(uut, 'parse').returns({ flags: {} });
            sandbox.stub(uut, 'validateFlags').resolves();
            sandbox.stub(uut, 'instantiateWallet').resolves();
            sandbox.stub(uut, 'getPublicKeys').resolves();
            sandbox.stub(uut, 'createMultisigWallet').resolves({});
            sandbox.stub(uut, 'instanceLibs').returns();
            sandbox.stub(uut, 'calcP2wdbWritePrice').resolves();
            sandbox.stub(uut, 'uploadDataToIpfs').resolves();
            sandbox.stub(uut, 'writeCidToBlockchain').resolves();
            const result = await uut.run();
            assert.equal(result, true);
        });
        it('should handle an error without a message', async () => {
            sandbox.stub(uut, 'parse').throws({});
            const result = await uut.run();
            assert.equal(result, 0);
        });
    });
});
