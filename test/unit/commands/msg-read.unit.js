import chai from "chai";
import sinon from "sinon";
import MsgRead from "../../../src/commands/msg-read.js";
import msgReadMock from "../../mocks/msg-read-mock.js";
import WalletCreate from "../../../src/commands/wallet-create.js";
import MockWallet from "../../mocks/msw-mock.js";
/* Unit tests for the msg-read command. */
// Global npm libraries
const assert = chai.assert;
const filename = `${__dirname.toString()}/../../../.wallets/test123.json`;
const walletCreate = new WalletCreate();
describe('msg-read', () => {
    let uut;
    let sandbox;
    let mockWallet;
    before(async () => {
        await walletCreate.createWallet(filename);
    });
    beforeEach(async () => {
        sandbox = sinon.createSandbox();
        uut = new MsgRead();
        uut.Read = msgReadMock.Read;
        mockWallet = new MockWallet();
    });
    afterEach(() => {
        sandbox.restore();
    });
    describe('#validateFlags()', () => {
        it('validateFlags() should return true .', () => {
            const flags = {
                txid: '36639f7c52ad385a2feeeed08240d92ebb05d7f8aa8a1e8531857bf7a9dc5948',
                name: 'my wallet'
            };
            assert.equal(uut.validateFlags(flags), true, 'return true');
        });
        it('validateFlags() should throw error if txid is not supplied.', () => {
            try {
                const flags = {};
                uut.validateFlags(flags);
                assert.fail('Unexpected code path');
            }
            catch (err) {
                assert.include(err.message, 'You must specify a txid with the -t flag.', 'Expected error message.');
            }
        });
        it('validateFlags() should throw error if wallet name is not supplied.', () => {
            try {
                const flags = {
                    txid: '36639f7c52ad385a2feeeed08240d92ebb05d7f8aa8a1e8531857bf7a9dc5948'
                };
                uut.validateFlags(flags);
                assert.fail('Unexpected code path');
            }
            catch (err) {
                assert.include(err.message, 'You must specify a wallet with the -n flag.', 'Expected error message.');
            }
        });
    });
    describe('#instanceLibs', () => {
        it('should instantiate the different libraries', async () => {
            // Mock dependencies and force desired code path
            sandbox.stub(uut.walletUtil, 'instanceWallet').resolves(mockWallet);
            const flags = {
                bchAddress: 'bitcoincash:qpufm97hppty67chexq4p53vc29mzg437vwp7huaa3',
                message: 'test message',
                subject: 'Test',
                name: 'test123'
            };
            const result = await uut.instanceLibs(flags);
            assert.equal(result, true);
        });
    });
    describe('#getHashFromTx()', () => {
        it('should throw an error if txData is not provided.', async () => {
            // Mock dependencies and force desired code path
            sandbox.stub(uut.walletUtil, 'instanceWallet').resolves(mockWallet);
            try {
                await uut.getHashFromTx();
                assert.fail('Unexpected result');
            }
            catch (err) {
                assert.include(err.message, 'txData object is required.', 'Expected error message.');
            }
        });
        it('should throw an error if ipfs hash not found.', async () => {
            // Mock dependencies and force desired code path
            sandbox.stub(uut.walletUtil, 'instanceWallet').resolves(mockWallet);
            try {
                const flags = {
                    name: 'test123',
                    txid: 'fake-txid'
                };
                await uut.instanceLibs(flags);
                await uut.getHashFromTx(msgReadMock.transactionData2[0]);
                assert.fail('Unexpected result');
            }
            catch (err) {
                assert.include(err.message, 'Message not found!', 'Expected error message.');
            }
        });
        it('should return hash from tx', async () => {
            // Mock dependencies and force desired code path
            sandbox.stub(uut.walletUtil, 'instanceWallet').resolves(mockWallet);
            const flags = {
                name: 'test123',
                txid: 'fake-txid'
            };
            await uut.instanceLibs(flags);
            const result = await uut.getHashFromTx(msgReadMock.transactionData[0]);
            assert.isString(result);
        });
    });
    describe('#getAndDecrypt', () => {
        it('should download and decrypt a message from the P2WDB', async () => {
            // Mock dependencies and force desired code path
            sandbox.stub(uut.walletUtil, 'instanceWallet').resolves(mockWallet);
            const flags = {
                name: 'test123',
                txid: 'fake-txid'
            };
            await uut.instanceLibs(flags);
            // Mock dependencies
            sandbox.stub(uut.read, 'getByHash').resolves(msgReadMock.hashData);
            sandbox
                .stub(uut.encryptLib.encryption, 'decryptFile')
                .resolves('5468697320697320612074657374206f6620746865207265666163746f72');
            const result = await uut.getAndDecrypt();
            // console.log('result: ', result)
            assert.include(result, 'This is a test of the refactor');
        });
    });
    describe('#getSenderFromTx', () => {
        it('should return the sender of a message', async () => {
            const txData = {
                vin: [{
                        address: 'fake-addr'
                    }]
            };
            const result = uut.getSenderFromTx(txData);
            assert.equal(result, 'fake-addr');
        });
    });
    describe('#MsgRead()', () => {
        it('should exit with error status if called without flags', async () => {
            try {
                await uut.msgRead({});
                assert.fail('Unexpected result');
            }
            catch (err) {
                assert.include(err.message, 'Wallet name is required.', 'Should throw expected error.');
            }
        });
        it('should read message.', async () => {
            // Mock dependencies and force desired code path
            sandbox.stub(uut.walletUtil, 'instanceWallet').resolves(mockWallet);
            const flags = {
                txid: '36639f7c52ad385a2feeeed08240d92ebb05d7f8aa8a1e8531857bf7a9dc5948',
                name: 'test123'
            };
            await uut.instanceLibs(flags);
            // Mock methods that will be tested elsewhere.
            sandbox.stub(uut.bchWallet, 'getTxData').resolves([{ key: 'value' }]);
            sandbox.stub(uut, 'getSenderFromTx').returns('fake-addr');
            sandbox.stub(uut, 'getHashFromTx').returns({});
            sandbox.stub(uut, 'getAndDecrypt').resolves('test message');
            const result = await uut.msgRead(flags);
            assert.equal(result.message, 'test message');
            assert.equal(result.sender, 'fake-addr');
        });
    });
    describe('#run()', () => {
        it('should return 0 and display error.message on empty flags', async () => {
            sandbox.stub(uut, 'parse').returns({ flags: {} });
            const result = await uut.run();
            assert.equal(result, 0);
        });
        it('should handle an error without a message', async () => {
            sandbox.stub(uut, 'parse').throws({});
            const result = await uut.run();
            assert.equal(result, 0);
        });
        it('should run the run() function', async () => {
            // Mock dependencies
            const flags = {
                txid: '36639f7c52ad385a2feeeed08240d92ebb05d7f8aa8a1e8531857bf7a9dc5948',
                name: 'test123'
            };
            // Mock methods that will be tested elsewhere.
            sandbox.stub(uut, 'parse').returns({ flags });
            sandbox.stub(uut, 'instanceLibs').resolves();
            sandbox.stub(uut, 'msgRead').resolves({ sender: 'fake-sender', message: 'test message' });
            const result = await uut.run();
            assert.equal(result, 'test message');
        });
    });
});
