/*
  Unit tests for the mc-collect-keys command.
*/

// Global npm libraries
import { assert } from 'chai'
import sinon from 'sinon'
import { promises } from 'fs'
import MCCollectKeys from '../../../src/commands/mc-collect-keys.js'
import WalletCreate from '../../../src/commands/wallet-create.js'
// const MockWallet = require('../../mocks/msw-mock')

// Hack to get __dirname back.
// https://blog.logrocket.com/alternatives-dirname-node-js-es-modules/
import * as url from 'url'

const fs = { promises }.promises
const walletCreate = new WalletCreate()
const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

const filename = `${__dirname.toString()}/../../../.wallets/test123.json`

describe('#mc-collect-keys', () => {
  let uut
  let sandbox
  // let mockWallet
  before(async () => {
    await walletCreate.createWallet(filename)
  })
  beforeEach(async () => {
    sandbox = sinon.createSandbox()
    uut = new MCCollectKeys()
    // mockWallet = new MockWallet()
  })
  afterEach(() => {
    sandbox.restore()
  })
  after(async () => {
    await fs.rm(filename)
  })
  describe('#instanceWallet', () => {
    it('should instantiate the wallet', async () => {
      // Mock dependencies
      // sandbox.stub(uut.walletUtil, 'instanceWallet').resolves(mockWallet)
      // sandbox.stub(uut.walletUtil, 'getP2wdbServer').resolves('https://p2wdb.fullstack.cash')
      const result = await uut.instanceWallet()
      assert.property(result, 'bchjs')
    })
  })
  describe('#getNftsFromGroup', () => {
    it('should get NFT token IDs from a Group token', async () => {
      await uut.instanceWallet()
      // Mock dependencies and force desired code path
      sandbox.stub(uut.wallet, 'getTokenData').resolves({
        genesisData: {
          nfts: ['a', 'b', 'c']
        }
      })
      const result = await uut.getNftsFromGroup('fake-group-id')
      assert.isArray(result)
    })
    it('should catch and throw errors', async () => {
      try {
        await uut.instanceWallet()
        // Mock dependencies and force desired code path
        sandbox.stub(uut.wallet, 'getTokenData').rejects(new Error('test error'))
        await uut.getNftsFromGroup()
        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'test error')
      }
    })
  })
  describe('#getAddrs', () => {
    it('should should return addresses associated with each NFT', async () => {
      await uut.instanceWallet()
      // Mock dependencies and force desired code path.
      sandbox.stub(uut.wallet, 'getTokenData').resolves({
        genesisData: {
          nftHolder: 'sam'
        }
      })
      const nfts = ['a']
      const result = await uut.getAddrs(nfts)
      assert.isArray(result)
      assert.equal(result[0], 'sam')
    })
    it('should catch and throw errors', async () => {
      try {
        await uut.getAddrs()
        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'Cannot read')
      }
    })
  })
  describe('#findKeys', () => {
    it('should collect public keys for an addresses', async () => {
      await uut.instanceWallet()
      const addrs = ['bitcoincash:qzwahhjldv0qsecfxlmcenzvkjv9rlv9au2hcfggl6']
      const nfts = ['fb707a9d8a4d6ba47ef0c510714ca46d4523cd29c8f4e3fd6a63a85edb8b05d2']
      // Mock dependencies and force desired code path.
      sandbox.stub(uut.wallet, 'getPubKey').resolves('02055962631b236ddcd2c17cd0b711f12438b93bcf01b206cadb351cc3e6e3e269')
      const result = await uut.findKeys(addrs, nfts)
      // console.log('result: ', result)
      // Assert expected properties exist
      assert.property(result, 'keys')
      assert.property(result, 'keysNotFound')
      // Assert that each property is an array.
      assert.isArray(result.keys)
      assert.isArray(result.keysNotFound)
      // Assert expected values exist
      assert.equal(result.keys[0].addr, 'bitcoincash:qzwahhjldv0qsecfxlmcenzvkjv9rlv9au2hcfggl6')
      assert.equal(result.keys[0].pubKey, '02055962631b236ddcd2c17cd0b711f12438b93bcf01b206cadb351cc3e6e3e269')
    })
    it('should handle address without a public key', async () => {
      await uut.instanceWallet()
      const addrs = ['bitcoincash:qzwahhjldv0qsecfxlmcenzvkjv9rlv9au2hcfggl6']
      const nfts = ['fb707a9d8a4d6ba47ef0c510714ca46d4523cd29c8f4e3fd6a63a85edb8b05d2']
      // Mock dependencies and force desired code path.
      sandbox.stub(uut.wallet, 'getPubKey').resolves('not found')
      const result = await uut.findKeys(addrs, nfts)
      // console.log('result: ', result)
      // Assert expected properties exist
      assert.property(result, 'keys')
      assert.property(result, 'keysNotFound')
      // Assert that each property is an array.
      assert.isArray(result.keys)
      assert.isArray(result.keysNotFound)
      // Assert expected values exist
      assert.equal(result.keysNotFound[0], 'bitcoincash:qzwahhjldv0qsecfxlmcenzvkjv9rlv9au2hcfggl6')
    })
    it('should catch and throw errors', async () => {
      try {
        await uut.findKeys()
        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'Cannot read')
      }
    })
  })
  describe('#run()', () => {
    it('should return 0 and display error.message on error', async () => {
      // Force an error
      sandbox.stub(uut, 'instanceWallet').rejects(new Error('test error'))
      const result = await uut.run()
      assert.equal(result, 0)
    })
    it('should return true on successful execution', async () => {
      // Mock dependencies
      sandbox.stub(uut, 'instanceWallet').resolves({})
      sandbox.stub(uut, 'getNftsFromGroup').resolves()
      sandbox.stub(uut, 'getAddrs').resolves()
      sandbox.stub(uut, 'findKeys').resolves({ keys: [], keysNotFound: [] })
      const result = await uut.run()
      assert.equal(result, true)
    })
  })
})
