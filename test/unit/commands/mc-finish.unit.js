/* Unit tests for the mc-finish command. */

// Global npm libraries
import { assert } from 'chai'
import sinon from 'sinon'
import MCFinish from '../../../src/commands/mc-finish.js'
import msgReadMock from '../../mocks/msg-read-mock.js'
import WalletCreate from '../../../src/commands/wallet-create.js'
import MockWallet from '../../mocks/msw-mock.js'
import mcFinishMocks from '../../mocks/mc-finish-mocks.js'

// Hack to get __dirname back.
// https://blog.logrocket.com/alternatives-dirname-node-js-es-modules/
import * as url from 'url'
const __dirname = url.fileURLToPath(new URL('.', import.meta.url))
const filename = `${__dirname.toString()}/../../../.wallets/test123.json`

const walletCreate = new WalletCreate()

describe('mc-finish', () => {
  let uut
  let sandbox
  let mockWallet
  before(async () => {
    await walletCreate.createWallet(filename)
  })
  beforeEach(async () => {
    sandbox = sinon.createSandbox()
    uut = new MCFinish()
    uut.Read = msgReadMock.Read
    mockWallet = new MockWallet()
  })
  afterEach(() => {
    sandbox.restore()
  })
  describe('#validateFlags()', () => {
    it('validateFlags() should return true .', () => {
      const flags = {
        txids: '["36639f7c52ad385a2feeeed08240d92ebb05d7f8aa8a1e8531857bf7a9dc5948"]',
        name: 'my wallet'
      }
      assert.equal(uut.validateFlags(flags), true, 'return true')
    })
    it('validateFlags() should throw error if wallet name is not supplied.', () => {
      try {
        const flags = {}
        uut.validateFlags(flags)
        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'You must specify a wallet with the -n flag.', 'Expected error message.')
      }
    })
    it('validateFlags() should throw error if txid is not supplied.', () => {
      try {
        const flags = {
          name: 'test-name'
        }
        uut.validateFlags(flags)
        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'You must specify an array of TXIDs contains signatures with the -a flag.', 'Expected error message.')
      }
    })
  })
  describe('#instanceLibs', () => {
    it('should instantiate the different libraries', async () => {
      // Mock dependencies and force desired code path
      sandbox.stub(uut.walletUtil, 'instanceWallet').resolves(mockWallet)
      const flags = {
        name: 'test123'
      }
      const result = await uut.instanceLibs(flags)
      assert.equal(result, true)
    })
  })
  describe('#getHashFromTx()', () => {
    it('should throw an error if txData is not provided.', async () => {
      // Mock dependencies and force desired code path
      sandbox.stub(uut.walletUtil, 'instanceWallet').resolves(mockWallet)
      try {
        await uut.getHashFromTx()
        assert.fail('Unexpected result')
      } catch (err) {
        assert.include(err.message, 'txData object is required.', 'Expected error message.')
      }
    })
    it('should throw an error if ipfs hash not found.', async () => {
      // Mock dependencies and force desired code path
      sandbox.stub(uut.walletUtil, 'instanceWallet').resolves(mockWallet)
      try {
        const flags = {
          name: 'test123',
          txid: 'fake-txid'
        }
        await uut.instanceLibs(flags)
        await uut.getHashFromTx(msgReadMock.transactionData2[0])
        assert.fail('Unexpected result')
      } catch (err) {
        assert.include(err.message, 'Message not found!', 'Expected error message.')
      }
    })
    it('should return hash from tx', async () => {
      // Mock dependencies and force desired code path
      sandbox.stub(uut.walletUtil, 'instanceWallet').resolves(mockWallet)
      const flags = {
        name: 'test123',
        txid: 'fake-txid'
      }
      await uut.instanceLibs(flags)
      const result = await uut.getHashFromTx(msgReadMock.transactionData[0])
      assert.isString(result)
    })
  })
  describe('#getAndDecrypt', () => {
    it('should download and decrypt a message from the P2WDB', async () => {
      // Mock dependencies and force desired code path
      sandbox.stub(uut.walletUtil, 'instanceWallet').resolves(mockWallet)
      const flags = {
        name: 'test123',
        txid: 'fake-txid'
      }
      await uut.instanceLibs(flags)
      // Mock dependencies
      sandbox.stub(uut.read, 'getByHash').resolves(msgReadMock.hashData)
      sandbox
        .stub(uut.encryptLib.encryption, 'decryptFile')
        .resolves('5468697320697320612074657374206f6620746865207265666163746f72')
      const result = await uut.getAndDecrypt()
      // console.log('result: ', result)
      assert.include(result, 'This is a test of the refactor')
    })
  })
  describe('#msgRead()', () => {
    it('should exit with error status if called without flags', async () => {
      try {
        await uut.msgRead({})
        assert.fail('Unexpected result')
      } catch (err) {
        assert.include(err.message, 'Wallet name is required.', 'Should throw expected error.')
      }
    })
    it('should read read message.', async () => {
      // Mock dependencies and force desired code path
      sandbox.stub(uut.walletUtil, 'instanceWallet').resolves(mockWallet)
      const flags = {
        txid: '36639f7c52ad385a2feeeed08240d92ebb05d7f8aa8a1e8531857bf7a9dc5948',
        name: 'test123'
      }
      await uut.instanceLibs(flags)
      // Mock methods that will be tested elsewhere.
      sandbox.stub(uut.bchWallet, 'getTxData').resolves([{
        vin: [{
          address: 'test-address'
        }]
      }])
      sandbox.stub(uut, 'getHashFromTx').returns({})
      sandbox.stub(uut, 'getAndDecrypt').resolves('{"message": "test message", "txObj": {}}')
      const result = await uut.msgRead(flags)
      assert.include(result.message, 'test message')
    })
  })
  describe('#collectSignatures', () => {
    it('should collect signatures from messages', async () => {
      // Mock dependencies and force desired code path
      sandbox.stub(uut.walletUtil, 'instanceWallet').resolves(mockWallet)
      const flags = {
        txids: '["36639f7c52ad385a2feeeed08240d92ebb05d7f8aa8a1e8531857bf7a9dc5948"]',
        name: 'test123'
      }
      await uut.instanceLibs(flags)
      // Mock dependencies and force desired code path
      sandbox.stub(uut, 'msgRead').resolves({ message: '{"publicKey": "fake-pubkey"}' })
      const result = await uut.collectSignatures(flags)
      // console.log('result: ', result)
      // Output should be an array of signatures.
      assert.isArray(result)
    })
    it('should catch and throw errors', async () => {
      try {
        await uut.collectSignatures()
        assert.fail('Unexpected code path')
      } catch (err) {
        // console.log('err: ', err.message)
        assert.include(err.message, 'Cannot destructure')
      }
    })
  })
  describe('#finishTx', () => {
    it('should sign and broadcast the TX', async () => {
      // Instantiate the wallet
      sandbox.stub(uut.walletUtil, 'instanceWallet').resolves(mockWallet)
      const flags = {
        name: 'test123'
      }
      await uut.instanceLibs(flags)
      // Mock dependencies and force desired code path
      sandbox.stub(uut.conf, 'get').returns(mcFinishMocks.txObj1)
      sandbox.stub(uut.bchWallet, 'broadcast').resolves('fake-txid')
      const sigs = mcFinishMocks.sigs1
      const result = await uut.finishTx(flags, sigs)
      // console.log('result: ', result)
      assert.equal(result, 'fake-txid')
    })
    it('should throw error if there are not enough signatures', async () => {
      try {
        // Instantiate the wallet
        sandbox.stub(uut.walletUtil, 'instanceWallet').resolves(mockWallet)
        const flags = {
          name: 'test123'
        }
        await uut.instanceLibs(flags)
        // Mock dependencies and force desired code path
        sandbox.stub(uut.conf, 'get').returns(mcFinishMocks.txObj1)
        sandbox.stub(uut.bchWallet, 'broadcast').resolves('fake-txid')
        // Force error by only including one signature.
        const sigs = [mcFinishMocks.sigs1[0]]
        await uut.finishTx(flags, sigs)
        assert.fail('Unexpected code path.')
      } catch (err) {
        // console.log('err: ', err)
        assert.include(err.message, 'TX requires')
      }
    })
    it('should catch and throw errors', async () => {
      try {
        await uut.finishTx()
        assert.fail('Unexpected code path')
      } catch (err) {
        // console.log('err: ', err.message)
        assert.include(err.message, 'Cannot read')
      }
    })
  })
  describe('#run()', () => {
    it('should return 0 and display error.message on empty flags', async () => {
      sandbox.stub(uut, 'parse').returns({ flags: {} })
      const result = await uut.run()
      assert.equal(result, 0)
    })
    it('should handle an error without a message', async () => {
      sandbox.stub(uut, 'parse').throws({})
      const result = await uut.run()
      assert.equal(result, 0)
    })
    it('should run the run() function', async () => {
      // Mock dependencies
      const flags = {
        txids: '["36639f7c52ad385a2feeeed08240d92ebb05d7f8aa8a1e8531857bf7a9dc5948"]',
        name: 'test123'
      }
      // Mock methods that will be tested elsewhere.
      sandbox.stub(uut, 'parse').returns({ flags })
      sandbox.stub(uut, 'instanceLibs').resolves()
      sandbox.stub(uut, 'collectSignatures').resolves(['sig1'])
      sandbox.stub(uut, 'finishTx').resolves('fake-txid')
      const result = await uut.run()
      assert.equal(result, true)
    })
  })
})
