
// Global npm libraries
import { assert } from 'chai'
import sinon from 'sinon'

// Local libraries
import IpfsRelays from '../../../src/commands/ipfs-relays.js'
import RelaysMock from '../../mocks/ipfs-relays-mock.js'

describe('#ipfs-relays', () => {
  let sandbox
  let uut
  beforeEach(async () => {
    sandbox = sinon.createSandbox()
    uut = new IpfsRelays()
  })
  afterEach(() => {
    sandbox.restore()
  })
  describe('#run', () => {
    it('should catch axios error and return false', async () => {
      sandbox.stub(uut.axios, 'post').throws(new Error('test error'))
      const result = await uut.run()
      assert.isFalse(result)
    })
    it('should display circuit relays and return true', async () => {
      sandbox.stub(uut.axios, 'post').resolves({ data: RelaysMock })
      const result = await uut.run()
      assert.isTrue(result)
    })
  })
})
