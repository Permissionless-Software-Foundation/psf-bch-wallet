import chai from "chai";
import sinon from "sinon";
import { promises } from "fs";
import TokenUpdate from "../../../src/commands/token-update.js";
import WalletCreate from "../../../src/commands/wallet-create.js";
import MockWallet from "../../mocks/msw-mock.js";
/*
  Unit tests for the token-update command.
*/
const assert = chai.assert;
const fs = { promises }.promises;
const walletCreate = new WalletCreate();
const filename = `${__dirname.toString()}/../../../.wallets/test123.json`;
describe('#token-update', () => {
    let uut;
    let sandbox;
    let mockWallet;
    before(async () => {
        await walletCreate.createWallet(filename);
    });
    beforeEach(async () => {
        sandbox = sinon.createSandbox();
        uut = new TokenUpdate();
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
                cid: 'test'
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
        it('validateFlags() should throw error if cid is not supplied.', () => {
            try {
                const flags = {
                    name: 'test123'
                };
                uut.validateFlags(flags);
            }
            catch (err) {
                assert.include(err.message, 'You must specify a CID with the -c flag.', 'Expected error message.');
            }
        });
    });
    describe('#instantiateSlpData', () => {
        it('should instantiate the SLP Mutable Data library', async () => {
            // Mock dependencies
            sandbox.stub(uut.walletUtil, 'instanceWallet').resolves(mockWallet);
            const flags = {
                name: 'test123'
            };
            const result = await uut.instantiateSlpData(flags);
            assert.equal(result, true);
        });
        it('should catch and throw errors', async () => {
            try {
                await uut.instantiateSlpData();
                assert.fail('Unexpected code path');
            }
            catch (err) {
                assert.include(err.message, 'Cannot read');
            }
        });
    });
    describe('#updateMutableData', () => {
        it('should generate tx to update mutable data', async () => {
            const flags = {
                name: 'test123',
                cid: 'fake-cid'
            };
            // Mock dependencies and force desired code path
            sandbox.stub(uut.walletUtil, 'instanceWallet').resolves(mockWallet);
            await uut.instantiateSlpData(flags);
            // Mock dependencies and force desired code path.
            sandbox.stub(uut.slpMutableData.data, 'writeCIDToOpReturn').resolves('fake-hex');
            const result = await uut.updateMutableData(flags);
            assert.equal(result, 'fake-hex');
        });
        it('should handle CIDs with a prefix', async () => {
            const flags = {
                name: 'test123',
                cid: 'ipfs://fake-cid'
            };
            // Mock dependencies and force desired code path
            sandbox.stub(uut.walletUtil, 'instanceWallet').resolves(mockWallet);
            await uut.instantiateSlpData(flags);
            // Mock dependencies and force desired code path.
            sandbox.stub(uut.slpMutableData.data, 'writeCIDToOpReturn').resolves('fake-hex');
            const result = await uut.updateMutableData(flags);
            assert.equal(result, 'fake-hex');
        });
        it('should catch and throw errors', async () => {
            try {
                await uut.updateMutableData();
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
        it('should return a TXID', async () => {
            const flags = {
                name: 'test123',
                cid: 'fake-cid'
            };
            // Mock dependencies and force desired code path
            sandbox.stub(uut.walletUtil, 'instanceWallet').resolves(mockWallet);
            sandbox.stub(uut, 'parse').returns({ flags });
            sandbox.stub(uut, 'validateFlags').returns();
            sandbox.stub(uut, 'updateMutableData').resolves('fake-hex');
            sandbox.stub(uut.walletUtil, 'broadcastTx').resolves('fake-txid');
            const result = await uut.run();
            assert.equal(result, 'fake-txid');
        });
    });
});
