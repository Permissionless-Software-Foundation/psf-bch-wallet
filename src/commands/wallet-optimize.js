import Conf from 'conf'
import WalletUtil from '../lib/wallet-util.js'
import command from '@oclif/command'
const { Command, flags } = command
class WalletOptimize extends Command {
  constructor (argv, config) {
    super(argv, config)
    // Encapsulate dependencies.
    this.walletUtil = new WalletUtil()
    this.conf = new Conf()
    this.wallet = null // placeholder
  }

  async run () {
    try {
      const { flags } = this.parse(WalletOptimize)
      // Validate input flags
      this.validateFlags(flags)
      // Instantiate the Write library.
      await this.instantiateWallet(flags)
      // Optimize the wallet
      await this.optimizeWallet(flags)
      return true
    } catch (err) {
      console.log('Error in wallet-optimize.js/run(): ', err.message)
      return 0
    }
  }

  // Optimize the wallet by consolidating the UTXOs.
  async optimizeWallet (flags) {
    try {
      const result = await this.wallet.optimize()
      console.log('Wallet has been optimized. Output object: ', result)
      return result
    } catch (err) {
      console.error('Error in optimizeWallet()')
      throw err
    }
  }

  // Instatiate the wallet library.
  async instantiateWallet (flags) {
    try {
      // Instantiate the wallet.
      this.wallet = await this.walletUtil.instanceWallet(flags.name)
      // console.log(`wallet.walletInfo: ${JSON.stringify(wallet.walletInfo, null, 2)}`)
      return true
    } catch (err) {
      console.error('Error in instantiateWrite()')
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
    return true
  }
}
WalletOptimize.description = `Optimize a wallet

This command 'optimizes' a wallet by consolidating the UTXOs with in it. This
consolidation can significantly reduce the number of API calls, which speeds
up the the network calls and results in an improved user experience (UX).
`
WalletOptimize.flags = {
  name: flags.string({ char: 'n', description: 'Name of wallet' })
}
export default WalletOptimize
