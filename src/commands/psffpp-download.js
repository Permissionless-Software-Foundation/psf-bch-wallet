import axios from 'axios'
import WalletUtil from '../lib/wallet-util.js'
import command from '@oclif/command'

// Hack to get __dirname back.
// https://blog.logrocket.com/alternatives-dirname-node-js-es-modules/
import * as url from 'url'
const { Command, flags } = command
const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

class IpfsDownload extends Command {
  constructor (argv, config) {
    super(argv, config)
    // Encapsulate dependencies.
    this.axios = axios
    this.walletUtil = new WalletUtil()
  }

  async run () {
    try {
      const { flags } = this.parse(IpfsDownload)
      const server = this.walletUtil.getRestServer()
      const result = await this.axios.post(`${server.restURL}/ipfs/download`, {
        cid: flags.cid,
        path: `${__dirname.toString()}/../../ipfs-files`,
        fileName: flags.fileName
      })
      console.log(`download result: ${JSON.stringify(result.data, null, 2)}`)
      return true
    } catch (err) {
      console.log('Error in run(): ', err)
      return false
    }
  }
}
IpfsDownload.description = 'Download a file, given its CID.'
IpfsDownload.flags = {
  cid: flags.string({
    char: 'c',
    description: 'CID of file to download'
  }),
  fileName: flags.string({
    char: 'f',
    description: 'filename to apply to the downloaded file'
  })
}
export default IpfsDownload
