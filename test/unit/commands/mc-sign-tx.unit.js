import { assert } from 'chai'
import sinon from 'sinon'
import MCSignTx from '../../../src/commands/mc-sign-tx.js'
import msgReadMock from '../../mocks/msg-read-mock.js'
import WalletCreate from '../../../src/commands/wallet-create.js'
import MockWallet from '../../mocks/msw-mock.js'
import MsgSendMock from '../../mocks/msg-send-mock.js'
/* Unit tests for the mc-read-tx command. */
// Global npm libraries

// Hack to get __dirname back.
// https://blog.logrocket.com/alternatives-dirname-node-js-es-modules/
import * as url from 'url'
const __dirname = url.fileURLToPath(new URL('.', import.meta.url))
const filename = `${__dirname.toString()}/../../../.wallets/test123.json`

const walletCreate = new WalletCreate()
describe('mc-sign-tx', () => {
  let uut
  let sandbox
  let mockWallet
  before(async () => {
    await walletCreate.createWallet(filename)
  })
  beforeEach(async () => {
    sandbox = sinon.createSandbox()
    uut = new MCSignTx()
    uut.Read = msgReadMock.Read
    mockWallet = new MockWallet()
  })
  afterEach(() => {
    sandbox.restore()
  })
  // after(() => {
  //   delete require.cache['bitcore-lib-cash']
  // })
  describe('#validateFlags()', () => {
    it('validateFlags() should return true .', () => {
      const flags = {
        txid: '36639f7c52ad385a2feeeed08240d92ebb05d7f8aa8a1e8531857bf7a9dc5948',
        name: 'my wallet'
      }
      assert.equal(uut.validateFlags(flags), true, 'return true')
    })
    it('validateFlags() should throw error if txid is not supplied.', () => {
      try {
        const flags = {}
        uut.validateFlags(flags)
        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'You must specify a txid with the -t flag.', 'Expected error message.')
      }
    })
    it('validateFlags() should throw error if wallet name is not supplied.', () => {
      try {
        const flags = {
          txid: '36639f7c52ad385a2feeeed08240d92ebb05d7f8aa8a1e8531857bf7a9dc5948'
        }
        uut.validateFlags(flags)
        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'You must specify a wallet with the -n flag.', 'Expected error message.')
      }
    })
  })
  describe('#instanceLibs', () => {
    it('should instantiate the different libraries', async () => {
      // Mock dependencies and force desired code path
      sandbox.stub(uut.walletUtil, 'instanceWallet').resolves(mockWallet)
      const flags = {
        bchAddress: 'bitcoincash:qpufm97hppty67chexq4p53vc29mzg437vwp7huaa3',
        message: 'test message',
        subject: 'Test',
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
  describe('#signTx', () => {
    it('should sign a the transaction', async () => {
      // Mock data
      const message = {
        message: 'test message',
        txObj: {
          hash: 'test-hash'
        }
      }
      class MockTx {
        sign () {
          const getSignatures = () => {
            const toObject = () => {
              return 'test-sig'
            }
            return [{
              toObject
            }]
          }
          const obj = {
            getSignatures
          }
          return obj
        }
      }
      class PrivKey {
      }
      sandbox.stub(uut.bitcore, 'Transaction').returns(new MockTx())
      sandbox.stub(uut.bitcore, 'PrivateKey').returns(new PrivKey())
      // Mock dependencies and force desired code path
      sandbox.stub(uut.walletUtil, 'instanceWallet').resolves(mockWallet)
      const flags = {
        txid: '36639f7c52ad385a2feeeed08240d92ebb05d7f8aa8a1e8531857bf7a9dc5948',
        name: 'test123'
      }
      await uut.instanceLibs(flags)
      const result = await uut.signTx(JSON.stringify(message))
      // console.log('result: ', result)
      assert.include(result, 'test-sig')
    })
    it('should catch and throw errors', async () => {
      try {
        await uut.signTx()
        assert.fail('Unexpected code path')
      } catch (err) {
        // console.log('err: ', err.message)
        assert.include(err.message, 'Unexpected token')
      }
    })
  })
  describe('#encryptMsg()', () => {
    it('should return the encrypted message.', async () => {
      // Initiate libraries
      sandbox.stub(uut.walletUtil, 'instanceWallet').resolves(mockWallet)
      const flags = { name: 'test123' }
      await uut.instanceLibs(flags)
      // Mock dependencies and force desired code path.
      sandbox.stub(uut.encryptLib.encryption, 'encryptFile').resolves('encrypted-message')
      const pubKey = MsgSendMock.getPubkeyResult.pubkey.publicKey
      const msg = 'message'
      const result = await uut.encryptMsg(pubKey, msg)
      assert.isString(result)
    })
    it('should throw an error if pubKey is not provided.', async () => {
      try {
        await uut.encryptMsg()
        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'pubKey must be a string', 'Expected error message.')
      }
    })
    it('should throw an error if msg is not provided.', async () => {
      try {
        const pubKey = MsgSendMock.getPubkeyResult.pubkey.publicKey
        await uut.encryptMsg(pubKey)
        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'msg must be a string', 'Expected error message.')
      }
    })
  })
  describe('#signalMessage()', () => {
    it('should throw an error if hash is not provided.', async () => {
      try {
        await uut.signalMessage()
        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'hash must be a string', 'Expected error message.')
      }
    })
    it('should throw an error if bchAddress is not provided.', async () => {
      try {
        const hash = 'QmYJXDxuNjwFuAYaUdADPnxKZJhQSsx69Ww2rGk6VmAFQu'
        await uut.signalMessage(hash)
        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'bchAddress must be a string', 'Expected error message.')
      }
    })
    it('should throw an error if subject is not provided.', async () => {
      try {
        const hash = 'QmYJXDxuNjwFuAYaUdADPnxKZJhQSsx69Ww2rGk6VmAFQu'
        const bchAddress = 'bitcoincash:qpufm97hppty67chexq4p53vc29mzg437vwp7huaa3'
        await uut.signalMessage(hash, bchAddress)
        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'subject must be a string', 'Expected error message.')
      }
    })
    it('should return transaction hex.', async () => {
      const bchAddress = 'bitcoincash:qpufm97hppty67chexq4p53vc29mzg437vwp7huaa3'
      const hash = 'QmYJXDxuNjwFuAYaUdADPnxKZJhQSsx69Ww2rGk6VmAFQu'
      const subject = 'subject'
      // Mock bch-message-lib
      uut.msgLib = {
        memo: {
          writeMsgSignal: () => 'tx hex'
        }
      }
      const result = await uut.signalMessage(hash, bchAddress, subject)
      assert.isString(result)
    })
    it('should throw error if cant build the tx', async () => {
      try {
        const bchAddress = 'bitcoincash:qpufm97hppty67chexq4p53vc29mzg437vwp7huaa3'
        const hash = 'QmYJXDxuNjwFuAYaUdADPnxKZJhQSsx69Ww2rGk6VmAFQu'
        const subject = 'subject'
        // Mock bch-message-lib
        uut.msgLib = {
          memo: {
            writeMsgSignal: () => null
          }
        }
        await uut.signalMessage(hash, bchAddress, subject)
        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'Could not build a hex transaction', 'Expected error message.')
      }
    })
  })
  describe('#encryptAndUpload', () => {
    it('should encrypt and send signature to originator', async () => {
      const inObj = {
        sig: 'test-sig',
        sender: 'test-sender'
      }
      // Initiate libraries
      sandbox.stub(uut.walletUtil, 'instanceWallet').resolves(mockWallet)
      const flags = { name: 'test123' }
      await uut.instanceLibs(flags)
      // Mock dependencies and force desired code path.
      sandbox.stub(uut.bchWallet, 'getPubKey').resolves('fake-pubkey')
      sandbox.stub(uut, 'encryptMsg').resolves('encrypted-message')
      sandbox.stub(uut.write, 'postEntry').resolves({})
      sandbox.stub(uut.bchWallet.bchjs.Util, 'sleep').resolves()
      sandbox.stub(uut.bchWallet, 'getUtxos').resolves()
      sandbox.stub(uut, 'signalMessage').resolves('fake-hex')
      sandbox.stub(uut.bchWallet, 'broadcast').resolves('fake-txid')
      const result = await uut.encryptAndUpload(inObj)
      assert.equal(result, true)
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
        txid: '36639f7c52ad385a2feeeed08240d92ebb05d7f8aa8a1e8531857bf7a9dc5948',
        name: 'test123'
      }
      // Mock methods that will be tested elsewhere.
      sandbox.stub(uut, 'parse').returns({ flags })
      sandbox.stub(uut, 'instanceLibs').resolves()
      sandbox.stub(uut, 'msgRead').resolves({ message: 'test message', sender: 'test-sender' })
      sandbox.stub(uut, 'signTx').resolves('fake-sig')
      sandbox.stub(uut, 'encryptAndUpload').resolves()
      const result = await uut.run()
      assert.equal(result, true)
    })
  })
})
