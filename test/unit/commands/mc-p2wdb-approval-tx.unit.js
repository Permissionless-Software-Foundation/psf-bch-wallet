import chai from 'chai'
import sinon from 'sinon'
import { promises } from 'fs'
import MCUpdateP2wdbPrice from '../../../src/commands/mc-p2wdb-approval-tx.js'
import WalletCreate from '../../../src/commands/wallet-create.js'
import MockWallet from '../../mocks/msw-mock.js'
import MsgSendMock from '../../mocks/msg-send-mock.js'

// Hack to get __dirname back.
// https://blog.logrocket.com/alternatives-dirname-node-js-es-modules/
import * as url from 'url'
/*
  Unit tests for the mc-update-p2wdb-price command.
*/
// Global npm libraries
const assert = chai.assert
const fs = { promises }.promises
const walletCreate = new WalletCreate()
const __dirname = url.fileURLToPath(new URL('.', import.meta.url))
const filename = `${__dirname.toString()}/../../../.wallets/test123.json`

describe('#mc-p2wdb-approval-tx', () => {
  let uut
  let sandbox
  let mockWallet
  before(async () => {
    await walletCreate.createWallet(filename)
  })
  beforeEach(async () => {
    sandbox = sinon.createSandbox()
    uut = new MCUpdateP2wdbPrice()
    mockWallet = new MockWallet()
  })
  afterEach(() => {
    sandbox.restore()
  })
  after(async () => {
    await fs.rm(filename)
  })
  describe('#validateFlags()', () => {
    it('validateFlags() should return true.', () => {
      const flags = {
        name: 'test123',
        txid: 'test'
      }
      assert.equal(uut.validateFlags(flags), true, 'return true')
    })
    it('validateFlags() should throw error if name is not supplied.', () => {
      try {
        const flags = {}
        uut.validateFlags(flags)
      } catch (err) {
        assert.include(err.message, 'You must specify a wallet with the -n flag.', 'Expected error message.')
      }
    })
    it('validateFlags() should throw error if txid is not supplied.', () => {
      try {
        const flags = { name: 'test123' }
        uut.validateFlags(flags)
      } catch (err) {
        assert.include(err.message, 'You must specify a txid with the -t flag.', 'Expected error message.')
      }
    })
  })
  describe('#instantiateWallet', () => {
    it('should instantiate the wallet', async () => {
      // Mock dependencies and force desired code path
      sandbox.stub(uut.walletUtil, 'instanceWallet').resolves(mockWallet)
      const flags = { name: 'test123' }
      const result = await uut.instantiateWallet(flags)
      assert.property(result, 'bchjs')
    })
    it('should catch and throw errors', async () => {
      try {
        await uut.instantiateWallet()
        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'Cannot destructure')
      }
    })
  })
  describe('#getPublicKeys', () => {
    it('should retrieve the public keys for each NFT holder', async () => {
      // Mock dependencies and force desired code path.
      sandbox.stub(uut.mcCollectKeys, 'instanceWallet').resolves()
      sandbox.stub(uut.mcCollectKeys, 'getNftsFromGroup').resolves(['fb707a9d8a4d6ba47ef0c510714ca46d4523cd29c8f4e3fd6a63a85edb8b05d2'])
      sandbox.stub(uut.mcCollectKeys, 'getAddrs').resolves(['bitcoincash:qzwahhjldv0qsecfxlmcenzvkjv9rlv9au2hcfggl6'])
      sandbox.stub(uut.mcCollectKeys, 'findKeys').resolves({
        keys: [{
          addr: 'bitcoincash:qzwahhjldv0qsecfxlmcenzvkjv9rlv9au2hcfggl6',
          pubKey: '02055962631b236ddcd2c17cd0b711f12438b93bcf01b206cadb351cc3e6e3e269'
        }],
        keysNotFound: []
      })
      const result = await uut.getPublicKeys()
      // console.log('result: ', result)
      assert.isArray(result)
      assert.equal(result[0].addr, 'bitcoincash:qzwahhjldv0qsecfxlmcenzvkjv9rlv9au2hcfggl6')
      assert.equal(result[0].pubKey, '02055962631b236ddcd2c17cd0b711f12438b93bcf01b206cadb351cc3e6e3e269')
    })
    it('should catch and throw errors', async () => {
      try {
        // Mock dependencies and force desired code path
        sandbox.stub(uut.mcCollectKeys, 'instanceWallet').rejects(new Error('test error'))
        await uut.getPublicKeys()
        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'test error')
      }
    })
  })
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
      ]
      const result = uut.createMultisigWallet(keyPairs)
      // console.log('result: ', result)
      assert.property(result, 'address')
      assert.property(result, 'scriptHex')
      assert.equal(result.publicKeys.length, 2)
      assert.equal(result.requiredSigners, 2)
    })
    it('should catch and throw errors', async () => {
      try {
        await uut.createMultisigWallet()
        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'Cannot read')
      }
    })
  })
  describe('#createMultisigTx', () => {
    it('should generate an unsigned multisignature TX', async () => {
      // Mock data
      const walletObj = {
        address: 'bitcoincash:pr2snkj2e0uk23ym05k3jamyslz8hdq2pgjmt7yq7e',
        scriptHex: 'a914d509da4acbf965449b7d2d19776487c47bb40a0a87',
        publicKeys: [
          '02055962631b236ddcd2c17cd0b711f12438b93bcf01b206cadb351cc3e6e3e269',
          '03112d4f9ad99e5866fdb72b0cf58683bd24e3e22734263e67b6b44aa5aab3a869',
          '0379347385945f8a8b276840e58496d1412e6a431021dbfda9782f3f50170ef4ef'
        ],
        requiredSigners: 2
      }
      const utxos = {
        bchUtxos: [{
          height: 773211,
          tx_hash: '0e04de58a3787c9c441709e7707fc79ea8cd11298decf63c132d4c5dc6d09d44',
          tx_pos: 2,
          value: 88130,
          txid: '0e04de58a3787c9c441709e7707fc79ea8cd11298decf63c132d4c5dc6d09d44',
          vout: 2,
          address: 'bitcoincash:pr2snkj2e0uk23ym05k3jamyslz8hdq2pgjmt7yq7e',
          isSlp: false,
          satoshis: 88130
        }]
      }
      const flags = {
        name: 'test123',
        txid: 'test'
      }
      // Mock dependencies and force desired code path
      sandbox.stub(uut.walletUtil, 'instanceWallet').resolves(mockWallet)
      await uut.instantiateWallet(flags)
      sandbox.stub(uut.wallet, 'getUtxos').resolves(utxos)
      const result = await uut.createMultisigTx(walletObj, flags)
      // console.log('result: ', result)
      assert.property(result, 'inputs')
      assert.property(result, 'outputs')
    })
    it('should catch and throw errors', async () => {
      try {
        await uut.createMultisigTx()
        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'Cannot read')
      }
    })
  })
  describe('#instanceLibs', () => {
    it('should instance the needed libraries', async () => {
      sandbox.stub(uut.walletUtil, 'instanceWallet').resolves(mockWallet)
      const flags = { name: 'test123' }
      await uut.instantiateWallet(flags)
      // Mock dependencies and force desired code path
      sandbox.stub(uut.walletUtil, 'instanceMsgLib').resolves()
      sandbox.stub(uut.walletUtil, 'getP2wdbServer').resolves()
      const result = uut.instanceLibs()
      assert.equal(result, true)
    })
  })
  describe('#encryptMsg()', () => {
    it('should return the encrypted message.', async () => {
      // Instantiate libraries
      sandbox.stub(uut.walletUtil, 'instanceWallet').resolves(mockWallet)
      const flags = { name: 'test123' }
      await uut.instantiateWallet(flags)
      await uut.instanceLibs()
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
      } catch (err) {
        assert.include(err.message, 'pubKey must be a string', 'Expected error message.')
      }
    })
    it('should throw an error if msg is not provided.', async () => {
      try {
        const pubKey = MsgSendMock.getPubkeyResult.pubkey.publicKey
        await uut.encryptMsg(pubKey)
      } catch (err) {
        assert.include(err.message, 'msg must be a string', 'Expected error message.')
      }
    })
  })
  describe('#signalMessage()', () => {
    it('should throw an error if hash is not provided.', async () => {
      try {
        await uut.signalMessage()
      } catch (err) {
        assert.include(err.message, 'hash must be a string', 'Expected error message.')
      }
    })
    it('should throw an error if bchAddress is not provided.', async () => {
      try {
        const hash = 'QmYJXDxuNjwFuAYaUdADPnxKZJhQSsx69Ww2rGk6VmAFQu'
        await uut.signalMessage(hash)
      } catch (err) {
        assert.include(err.message, 'bchAddress must be a string', 'Expected error message.')
      }
    })
    it('should throw an error if subject is not provided.', async () => {
      try {
        const hash = 'QmYJXDxuNjwFuAYaUdADPnxKZJhQSsx69Ww2rGk6VmAFQu'
        const bchAddress = 'bitcoincash:qpufm97hppty67chexq4p53vc29mzg437vwp7huaa3'
        await uut.signalMessage(hash, bchAddress)
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
      } catch (err) {
        assert.include(err.message, 'Could not build a hex transaction', 'Expected error message.')
      }
    })
  })
  describe('#encryptAndUpload', () => {
    it('should encrypt and send messages with default subject and message', async () => {
      const keys = [{
        addr: 'test-addr',
        pubKey: 'test-public-key'
      }]
      // Initiate libraries
      sandbox.stub(uut.walletUtil, 'instanceWallet').resolves(mockWallet)
      const flags = { name: 'test123' }
      await uut.instantiateWallet(flags)
      await uut.instanceLibs()
      // Mock dependencies and force desired code path.
      sandbox.stub(uut, 'encryptMsg').resolves('encrypted-message')
      sandbox.stub(uut.write, 'postEntry').resolves({})
      sandbox.stub(uut.wallet.bchjs.Util, 'sleep').resolves()
      sandbox.stub(uut, 'signalMessage').resolves('fake-hex')
      sandbox.stub(uut.wallet, 'broadcast').resolves('fake-txid')
      const result = await uut.encryptAndUpload({}, keys, {})
      assert.equal(result, true)
    })
    it('should encrypt and send messages with custom subject and message', async () => {
      const keys = [{
        addr: 'test-addr',
        pubKey: 'test-public-key'
      }]
      const flags = {
        name: 'test123',
        subject: 'test subject',
        message: 'test message'
      }
      // Initiate libraries
      sandbox.stub(uut.walletUtil, 'instanceWallet').resolves(mockWallet)
      await uut.instantiateWallet(flags)
      await uut.instanceLibs()
      // Mock dependencies and force desired code path.
      sandbox.stub(uut, 'encryptMsg').resolves('encrypted-message')
      sandbox.stub(uut.write, 'postEntry').resolves({})
      sandbox.stub(uut.wallet.bchjs.Util, 'sleep').resolves()
      sandbox.stub(uut, 'signalMessage').resolves('fake-hex')
      sandbox.stub(uut.wallet, 'broadcast').resolves('fake-txid')
      const result = await uut.encryptAndUpload({}, keys, flags)
      assert.equal(result, true)
    })
  })
  describe('#run', () => {
    it('should return true on successful execution', async () => {
      // Mock dependencies and force desired code path
      sandbox.stub(uut, 'parse').returns({ flags: {} })
      sandbox.stub(uut, 'validateFlags').resolves()
      sandbox.stub(uut, 'instantiateWallet').resolves()
      sandbox.stub(uut, 'getPublicKeys').resolves()
      sandbox.stub(uut, 'createMultisigWallet').resolves({})
      sandbox.stub(uut, 'createMultisigTx').resolves({})
      sandbox.stub(uut, 'instanceLibs').resolves()
      sandbox.stub(uut, 'encryptAndUpload').resolves()
      const result = await uut.run()
      assert.equal(result, true)
    })
    it('should handle an error without a message', async () => {
      sandbox.stub(uut, 'parse').throws({})
      const result = await uut.run()
      assert.equal(result, 0)
    })
  })
})
