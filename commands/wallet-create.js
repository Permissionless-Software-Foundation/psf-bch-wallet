/*
  Create a new wallet.
*/

// Global npm libraries
import BchWallet from 'minimal-slp-wallet'

// Global variables
const __dirname = import.meta.dirname

class WalletCreate {
  constructor() {
    this.run = this.run.bind(this)
    this.validateFlags = this.validateFlags.bind(this)
  }

  async run(flags) {
    this.validateFlags(flags)

    const filename = `${__dirname.toString()}/../.wallets/${
      flags.name
    }.json`

    if (!flags.description) flags.description = ''

    console.log(`wallet-create executed with name ${flags.name} and description ${flags.description}`)
  }

  validateFlags(flags) {
    // Exit if wallet not specified.
    const name = flags.name
    if (!name || name === '') {
      throw new Error('You must specify a wallet with the -n flag.')
    }

    return true
  }
}

export default WalletCreate
