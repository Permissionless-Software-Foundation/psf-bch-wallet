import chai from "chai";
import sinon from "sinon";
import { promises } from "fs";
import P2WDBPin from "../../../src/commands/p2wdb-pin.js";
import WalletCreate from "../../../src/commands/wallet-create.js";
import MockWallet from "../../mocks/msw-mock.js";
/*
  Unit tests for the p2wdb-pin command.
*/
const assert = chai.assert;
const fs = { promises }.promises;
const walletCreate = new WalletCreate();
const filename = `${__dirname.toString()}/../../../.wallets/test123.json`;
describe('#p2wdb-pin', () => {
    let uut;
    let sandbox;
    let mockWallet;
    before(async () => {
        await walletCreate.createWallet(filename);
    });
    beforeEach(async () => {
        sandbox = sinon.createSandbox();
        uut = new P2WDBPin();
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
                assert.include(err.message, 'You must specify an IPFS CID with the -c flag.', 'Expected error message.');
            }
        });
    });
    describe('#instantiatePin', () => {
        it('should instantiate the Pin library', async () => {
            // Mock dependencies
            sandbox.stub(uut.walletUtil, 'instanceWallet').resolves(mockWallet);
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
                assert.include(err.message, 'Cannot read');
            }
        });
    });
    describe('#pinCid', () => {
        // it('should write data to the P2WDB', async () => {
        //   // Mock dependencies
        //   uut.pin = {
        //     cid: () => { return { hash: 'fake-hash' } }
        //   }
        //
        //   const result = await uut.pinCid({})
        //
        //   assert.equal(result, 'fake-hash')
        // })
        it('should catch and throw errors', async () => {
            try {
                await uut.pinCid();
                assert.fail('Unexpected code path');
            }
            catch (err) {
                assert.include(err.message, 'Cannot read');
            }
        });
        // it('should handle payments with PSF instead of BCH', async () => {
        //   // Mock dependencies
        //   uut.pin = {
        //     cid: () => { return { hash: { hash: 'fake-hash' } } }
        //   }
        //
        //   const result = await uut.pinCid({})
        //
        //   assert.equal(result, 'fake-hash')
        // })
    });
    describe('#run()', () => {
        it('should return 0 and display error.message on empty flags', async () => {
            sandbox.stub(uut, 'parse').returns({ flags: {} });
            const result = await uut.run();
            assert.equal(result, 0);
        });
        it('should return a CID', async () => {
            // Mock dependencies
            sandbox.stub(uut, 'parse').returns({ flags: {} });
            sandbox.stub(uut, 'validateFlags').returns();
            sandbox.stub(uut, 'instantiatePin').resolves();
            sandbox.stub(uut, 'pinCid').resolves('fake-cid');
            const result = await uut.run();
            assert.equal(result, 'fake-cid');
        });
    });
});
