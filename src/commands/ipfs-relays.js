import axios from 'axios'
import WalletUtil from '../lib/wallet-util.js'
import command from '@oclif/command'
const { Command } = command
class IpfsRelays extends Command {
  constructor (argv, config) {
    super(argv, config)
    // Encapsulate dependencies.
    this.axios = axios
    this.walletUtil = new WalletUtil()
  }

  async run () {
    try {
      const server = this.walletUtil.getRestServer()
      const result = await this.axios.post(`${server.restURL}/ipfs/relays`, {})
      console.log(`Circuit Relays: ${JSON.stringify(result.data, null, 2)}`)
      return true
    } catch (err) {
      console.log('Error in run(): ', err)
      return false
    }
  }
}
IpfsRelays.description = 'Query the state of circuit relays'
IpfsRelays.flags = {}
export default IpfsRelays
