import axios from 'axios'
import WalletUtil from '../lib/wallet-util.js'
import command from '@oclif/command'
const { Command } = command
class IpfsStatus extends Command {
  constructor (argv, config) {
    super(argv, config)
    // Encapsulate dependencies.
    this.axios = axios
    this.walletUtil = new WalletUtil()
  }

  async run () {
    try {
      const server = this.walletUtil.getRestServer()
      const result = await this.axios.get(`${server.restURL}/ipfs`)
      console.log(`IPFS status: ${JSON.stringify(result.data, null, 2)}`)
      return true
    } catch (err) {
      console.log('Error in run(): ', err)
      return false
    }
  }
}
IpfsStatus.description = 'Query the state of the IPFS node'
IpfsStatus.flags = {}
export default IpfsStatus
