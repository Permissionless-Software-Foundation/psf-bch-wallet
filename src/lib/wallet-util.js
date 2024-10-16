/*
  wallet-based utility functions used by several different commands
*/

// Global npm libraries.
import {promises as fs} from 'fs'

class WalletUtil {
  constructor() {
    // Encapsulate all dependencies
    this.fs = fs

    // Bind 'this' object to all subfunctions.
    this.saveWallet = this.saveWallet.bind(this)
  }

  async saveWallet(filename, walletData) {
    await this.fs.writeFile(filename, JSON.stringify(walletData, null, 2))

    return true
  }
}

export default WalletUtil
