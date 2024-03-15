import Conf from 'conf'
import p2wdb from 'p2wdb'
import WalletUtil from '../lib/wallet-util.js'
import command from '@oclif/command'
const { Pin } = p2wdb
const { Command, flags } = command
class P2WDBPin extends Command {
  constructor (argv, config) {
    super(argv, config)
    // Encapsulate dependencies.
    this.walletUtil = new WalletUtil()
    this.conf = new Conf()
    this.Pin = Pin
  }

  async run () {
    try {
      const { flags } = this.parse(P2WDBPin)
      // Validate input flags
      this.validateFlags(flags)
      // Instantiate the Write library.
      await this.instantiatePin(flags)
      const hash = await this.pinCid(flags)
      // console.log(hash)
      console.log(`https://p2wdb.fullstack.cash/entry/hash/${hash}`)
      return hash
    } catch (err) {
      console.log('Error in p2wdb-pin.js/run(): ', err.message)
      return 0
    }
  }

  // Instatiate the Write library.
  async instantiatePin (flags) {
    try {
      // Instantiate the wallet.
      const wallet = await this.walletUtil.instanceWallet(flags.name)
      // console.log(`wallet.walletInfo: ${JSON.stringify(wallet.walletInfo, null, 2)}`)
      // Get the P2WDB server.
      const p2wdbServer = this.walletUtil.getP2wdbServer()
      // Get the REST URL
      const server = this.walletUtil.getRestServer()
      // Instantiate the Write library.
      this.pin = new this.Pin({
        bchWallet: wallet,
        serverURL: p2wdbServer,
        interface: server.interface,
        restURL: server.restURL
      })
      return true
    } catch (err) {
      console.error('Error in instantiateWrite()')
      throw err
    }
  }

  // Instantiate the p2wdb Write library and write the data to the P2WDB.
  async pinCid (flags) {
    try {
      // Write data to the P2WDB.
      const hash = await this.pin.cid(flags.cid)
      console.log('hash: ', hash)
      return hash
    } catch (err) {
      console.error('Error in pinCid(): ', err)
      throw err
    }
  }

  // Validate the proper flags are passed in.
  validateFlags (flags) {
    // Exit if wallet not specified.
    const name = flags.name
    if (!name || name === '') {
      throw new Error('You must specify a wallet with the -n flag.')
    }
    const cid = flags.cid
    if (!cid || cid === '') {
      throw new Error('You must specify an IPFS CID with the -c flag.')
    }
    return true
  }
}
P2WDBPin.description = `Pin an IPFS CID using the P2WDB pinning service

This command uses the p2wdb npm library to pin an IPFS CID using the P2WDB
pinning service.

Note: Currently only files 1MB or less are supported.
`
P2WDBPin.flags = {
  name: flags.string({ char: 'n', description: 'Name of wallet' }),
  cid: flags.string({
    char: 'c',
    description: 'IPFS CID to pin'
  })
}
export default P2WDBPin
