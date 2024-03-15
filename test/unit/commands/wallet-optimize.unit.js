import chai from 'chai'
import sinon from 'sinon'
import { promises } from 'fs'
import WalletOptimize from '../../../src/commands/wallet-optimize.js'
import WalletCreate from '../../../src/commands/wallet-create.js'
import MockWallet from '../../mocks/msw-mock.js'

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

describe('#wallet-optimize', () => {
  let uut
  let sandbox
  let mockWallet
  before(async () => {
    await walletCreate.createWallet(filename)
  })
  beforeEach(async () => {
    sandbox = sinon.createSandbox()
    uut = new WalletOptimize()
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
        name: 'test123'
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
  })
  describe('#instantiateWallet', () => {
    it('should instantiate the wallet', async () => {
      // Mock dependencies
      sandbox.stub(uut.walletUtil, 'instanceWallet').resolves(mockWallet)
      // sandbox.stub(uut.walletUtil, 'getP2wdbServer').resolves('https://p2wdb.fullstack.cash')
      const flags = {
        name: 'test123'
      }
      const result = await uut.instantiateWallet(flags)
      assert.equal(result, true)
    })
    it('should catch and throw errors', async () => {
      try {
        await uut.instantiateWallet()
        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'Cannot read')
      }
    })
  })
  describe('#optimizeWallet', () => {
    it('should optimize the wallet', async () => {
      uut.wallet = mockWallet
      // Mock dependencies
      sandbox.stub(uut.wallet, 'optimize').resolves(true)
      const flags = {
        name: 'test123'
      }
      const result = await uut.optimizeWallet(flags)
      assert.equal(result, true)
    })
    it('should catch and throw errors', async () => {
      try {
        await uut.optimizeWallet()
        assert.fail('Unexpected code path')
      } catch (err) {
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
    it('should return true', async () => {
      // Mock dependencies
      sandbox.stub(uut, 'parse').returns({ flags: { name: 'test123' } })
      sandbox.stub(uut, 'validateFlags').returns()
      // sandbox.stub(uut, 'pinJson').resolves('fake-cid')
      sandbox.stub(uut.walletUtil, 'instanceWallet').resolves(mockWallet)
      sandbox.stub(uut, 'optimizeWallet').resolves()
      const result = await uut.run()
      assert.equal(result, true)
    })
  })
})
