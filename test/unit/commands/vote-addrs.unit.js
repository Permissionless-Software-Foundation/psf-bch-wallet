import chai from 'chai'
import sinon from 'sinon'
import { promises } from 'fs'
import VoteAddrs from '../../../src/commands/vote-addrs.js'
import WalletCreate from '../../../src/commands/wallet-create.js'
// const MockWallet = require('../../mocks/msw-mock')

// Hack to get __dirname back.
// https://blog.logrocket.com/alternatives-dirname-node-js-es-modules/
import * as url from 'url'
/*
  Unit tests for the p2wdb-json command.
*/
// Global npm libraries
const assert = chai.assert
const fs = { promises }.promises
const walletCreate = new WalletCreate()
const __dirname = url.fileURLToPath(new URL('.', import.meta.url))
const filename = `${__dirname.toString()}/../../../.wallets/test123.json`

describe('#vote-addrs', () => {
  let uut
  let sandbox
  // let mockWallet
  before(async () => {
    await walletCreate.createWallet(filename)
  })
  beforeEach(async () => {
    sandbox = sinon.createSandbox()
    uut = new VoteAddrs()
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
      uut.TOKENS_TO_IGNORE = ['b']
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
        // await uut.instanceWallet()
        // Mock dependencies and force desired code path
        // sandbox.stub(uut.wallet, 'getTokenData').rejects(new Error('test error'))
        await uut.getAddrs()
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
      const result = await uut.run()
      assert.equal(result, true)
    })
  })
})
