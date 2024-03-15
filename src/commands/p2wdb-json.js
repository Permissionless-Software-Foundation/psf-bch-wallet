import Conf from 'conf'
import p2wdb from 'p2wdb'
import WalletUtil from '../lib/wallet-util.js'
import command from '@oclif/command'
const { Pin, Write } = p2wdb
const { Command, flags } = command
class P2WDBJson extends Command {
  constructor (argv, config) {
    super(argv, config)
    // Encapsulate dependencies.
    this.walletUtil = new WalletUtil()
    this.conf = new Conf()
    this.Pin = Pin
    this.Write = Write
    this.wallet = null // placeholder
  }

  async run () {
    try {
      const { flags } = this.parse(P2WDBJson)
      // Validate input flags
      this.validateFlags(flags)
      // Instantiate the Write library.
      await this.instantiateWrite(flags)
      // Instantiate the Pin library.
      await this.instantiatePin(flags)
      const cid = await this.pinJson(flags)
      console.log(`JSON data pinned to IPFS with this CID: ${cid}`)
      return cid
    } catch (err) {
      console.log('Error in p2wdb-pin.js/run(): ', err.message)
      return 0
    }
  }

  // Instatiate the Write library.
  async instantiateWrite (flags) {
    try {
      // Instantiate the wallet.
      this.wallet = await this.walletUtil.instanceWallet(flags.name)
      // console.log(`wallet.walletInfo: ${JSON.stringify(wallet.walletInfo, null, 2)}`)
      // Get the P2WDB server.
      const p2wdbServer = this.walletUtil.getP2wdbServer()
      // Get the REST URL
      const server = this.walletUtil.getRestServer()
      // Instantiate the Write library.
      this.write = new this.Write({
        bchWallet: this.wallet,
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

  // Instatiate the Write library.
  async instantiatePin (flags) {
    try {
      // Instantiate the wallet.
      // const wallet = await this.walletUtil.instanceWallet(flags.name)
      // console.log(`wallet.walletInfo: ${JSON.stringify(wallet.walletInfo, null, 2)}`)
      // Get the P2WDB server.
      const p2wdbServer = this.walletUtil.getP2wdbServer()
      // Get the REST URL
      const server = this.walletUtil.getRestServer()
      // Instantiate the Write library.
      this.pin = new this.Pin({
        bchWallet: this.wallet,
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
  async pinJson (flags) {
    try {
      // Parse the JSON string into an object.
      const jsonData = JSON.parse(flags.json)
      const appId = 'token-data-001'
      // Upload JSON data to the P2WDB.
      const result1 = await this.write.postEntry(jsonData, appId)
      const zcid1 = result1.hash
      console.log(`Data added to P2WDB with this zcid: ${zcid1}`)
      console.log(`https://p2wdb.fullstack.cash/entry/hash/${zcid1}\n`)
      // Request the P2WDB Pinning Service extract the data and pin it separately
      // as an IPFS CID (which starts with 'bafy').
      const cid = await this.pin.json(zcid1)
      console.log(`JSON CID: ${cid}\n`)
      // Pin the CID across the P2WDB pinning cluster
      const result2 = await this.pin.cid(cid)
      const zcid2 = result2.hash
      console.log('Data pinned across the P2WDB Pinning Cluster.')
      console.log(`https://p2wdb.fullstack.cash/entry/hash/${zcid2}\n`)
      return cid
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
    const json = flags.json
    if (!json || json === '') {
      throw new Error('You must specify a JSON string with the -j flag.')
    }
    return true
  }
}
P2WDBJson.description = `Upload JSON to IPFS

This command uses the p2wdb npm library to upload a JSON object to an IPFS node.
The node returns a CID representing the JSON. That CID can then be pinned using
the P2WDB Pinning cluster, using the p2wdb-pin command.
`
P2WDBJson.flags = {
  name: flags.string({ char: 'n', description: 'Name of wallet' }),
  json: flags.string({
    char: 'j',
    description: 'A JSON string. Encase this argument in single quotes.'
  })
}
export default P2WDBJson
