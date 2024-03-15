import command from '@oclif/command'
import EncryptLib from 'bch-encrypt-lib/index.js'
import p2wdb from 'p2wdb'
import bitcore from 'bitcore-lib-cash'
import Conf from 'conf'
import WalletUtil from '../lib/wallet-util.js'
/*
  Retrieve signatures from e2ee messages and use them to complete the
  unsigned transaction.
*/
/* eslint new-cap: 0 */
// Global npm libraries
const { Command, flags } = command
const Read = p2wdb.Read
const Write = p2wdb.Write
class MCFinish extends Command {
  constructor (argv, config) {
    super(argv, config)
    // Encapsulate dependencies
    this.encryptLib = null // placeholder
    this.Read = Read
    this.Write = Write
    this.walletUtil = new WalletUtil()
    this.conf = new Conf()
    this.bitcore = bitcore
  }

  async run () {
    try {
      const { flags } = this.parse(MCFinish)
      // Validate input flags
      this.validateFlags(flags)
      // Instatiate all the libraries orchestrated by this function.
      await this.instanceLibs(flags)
      const sigs = await this.collectSignatures(flags)
      console.log('sigs: ', sigs)
      const txid = await this.finishTx(flags, sigs)
      console.log('txid: ', txid)
      return true
    } catch (error) {
      console.log('Error in multisig-sign.js/run(): ', error)
      return 0
    }
  }

  // Finish by adding the signatures to the transaction and broadcasting it.
  async finishTx (flags, sigs) {
    try {
      // Unsigned TX
      // const txObj = JSON.parse(flags.tx)
      const txObj = this.conf.get('p2wdb-price-tx', {})
      // console.log('txObj: ', txObj)
      console.log(`txObj: ${JSON.stringify(txObj, null, 2)}`)
      const tx = new this.bitcore.Transaction(txObj)
      // Determine the number of signatures needed for the tx.
      const numSigs = Math.floor(txObj.inputs[0].signatures.length / 2) + 1
      if (sigs.length < numSigs) {
        throw new Error(`TX requires ${numSigs} signatures, but only ${sigs.length} have been provided.`)
      }
      for (let i = 0; i < numSigs; i++) {
        console.log(`i: ${i}`)
        const thisSig = sigs[i].message
        console.log('thisSig: ', thisSig)
        const sig = new bitcore.Transaction.Signature.fromObject(thisSig)
        tx.applySignature(sig)
      }
      const hex = tx.toString()
      // Broadcast the transaction to the network.
      // Note: Now that the TX is fully signed, it can be sent to anyone and broadcast by anyone.
      const txid = await this.bchWallet.broadcast(hex)
      console.log(`\ntxid: ${txid}`)
      console.log(`https://blockchair.com/bitcoin-cash/transaction/${txid}`)
      return txid
    } catch (err) {
      console.error('Error in finishTx()')
      throw err
    }
  }

  // Loop through the array of TXIDs and retrieve the signatures.
  async collectSignatures (flags) {
    try {
      let { txids } = flags
      txids = JSON.parse(txids)
      console.log('txids: ', txids)
      const sigs = []
      // Loop through each TXID
      for (let i = 0; i < txids.length; i++) {
        const thisTxid = txids[i]
        flags.txid = thisTxid
        // const { message, sender } = await this.msgRead(flags)
        const sig = await this.msgRead(flags)
        console.log('sig: ', sig)
        sig.message = JSON.parse(sig.message)
        sigs.push(sig)
      }
      return sigs
    } catch (err) {
      console.error('Error in collectSignatures()')
      throw err
    }
  }

  // Check for messages
  async msgRead (flags) {
    try {
      // Input validation
      if (!flags.name || typeof flags.name !== 'string') {
        throw new Error('Wallet name is required.')
      }
      const { txid } = flags
      console.log('txid: ', txid)
      // Get TX Data
      const txDataResult = await this.bchWallet.getTxData([txid])
      // console.log('txDataResult: ', txDataResult)
      const txData = txDataResult[0]
      // console.log(`txData: ${JSON.stringify(txData, null, 2)}`)
      const sender = txData.vin[0].address
      // get ipfs hash from tx OP_RETURN
      const hash = this.getHashFromTx(txData)
      console.log('message P2WDB zCID: ', hash)
      // Get the encrypted message from P2WDB and decrypt it.
      const message = await this.getAndDecrypt(hash)
      return { message, sender }
    } catch (error) {
      console.log('Error in msgRead()')
      throw error
    }
  }

  // Retrieve the encrypted data from the P2WDB and decrypt it.
  async getAndDecrypt (hash) {
    // get hash data from p2wd
    const hashData = await this.read.getByHash(hash)
    // console.log(`hashData: ${JSON.stringify(hashData, null, 2)}`)
    const encryptedStr = hashData.value.data
    const encryptedObj = JSON.parse(encryptedStr)
    const encryptedData = encryptedObj.data.data
    console.log('this.bchWallet.walletInfo: ', this.bchWallet.walletInfo)
    // decrypt message
    const messageHex = await this.encryptLib.encryption.decryptFile(this.bchWallet.walletInfo.privateKey, encryptedData)
    // console.log(`messageHex: ${messageHex}`)
    const buf = Buffer.from(messageHex, 'hex')
    const decryptedMsg = buf.toString('utf8')
    // console.log('Message :', decryptedMsg)
    return decryptedMsg
  }

  // decode and get transaction hash from OP_RETURN
  getHashFromTx (txData) {
    try {
      // Input validation
      if (!txData) {
        throw new Error('txData object is required.')
      }
      let hash = ''
      // Loop through all the vout entries in this transaction.
      for (let j = 0; j < txData.vout.length; j++) {
        // for (let j = 0; j < 5; j++) {
        const thisVout = txData.vout[j]
        // console.log(`thisVout: ${JSON.stringify(thisVout,null,2)}`)
        // Assembly code representation of the transaction.
        const asm = thisVout.scriptPubKey.asm
        // console.log(`asm: ${asm}`)
        // Decode the transactions assembly code.
        const msg = this.msgLib.memo.decodeTransaction(asm, '-21101')
        if (msg) {
          // Filter the code to see if it contains an IPFS hash And Subject.
          const data = this.msgLib.memo.filterMSG(msg, 'MSG IPFS')
          if (data && data.hash) {
            hash = data.hash
          }
        }
      }
      if (!hash) {
        throw new Error('Message not found!')
      }
      return hash
    } catch (error) {
      console.log('Error in getHashFromTx()')
      throw error
    }
  }

  // Instatiate the various libraries used by msgSend(). These libraries are
  // encasulated in the 'this' object.
  async instanceLibs (flags) {
    const { name } = flags
    // Instantiate minimal-slp-wallet.
    this.bchWallet = await this.walletUtil.instanceWallet(name)
    const walletData = this.bchWallet.walletInfo
    // Instantiate the bch-message-lib library.
    this.msgLib = this.walletUtil.instanceMsgLib(this.bchWallet)
    // Instatiate the P2WDB Write library.
    const p2wdbConfig = {
      wif: walletData.privateKey
    }
    this.read = new this.Read(p2wdbConfig)
    // Get the selected P2WDB server URL
    const serverURL = this.walletUtil.getP2wdbServer()
    // Instatiate the P2WDB Write library.
    const p2wdbConfig2 = {
      bchWallet: this.bchWallet,
      serverURL
    }
    this.write = new this.Write(p2wdbConfig2)
    this.encryptLib = new EncryptLib({
      bchjs: this.bchWallet.bchjs
    })
    return true
  }

  // Validate the proper flags are passed in.
  validateFlags (flags) {
    // Exit if wallet not specified.
    const name = flags.name
    const txids = flags.txids
    if (!name || name === '') {
      throw new Error('You must specify a wallet with the -n flag.')
    }
    if (!txids || txids === '') {
      throw new Error('You must specify an array of TXIDs contains signatures with the -a flag.')
    }
    return true
  }
}
MCFinish.description = `Retrieve signatures, sign multisig TX, and broadcast

This command expects a JSON string containing an array of transaction IDs (TXIDs)
that contain e2ee messages containing signatures for the transaction generated
by the mc-update-p2wdb-price command.
`
MCFinish.flags = {
  name: flags.string({ char: 'n', description: 'Name of wallet' }),
  txids: flags.string({ char: 'a', description: 'Array of TXIDs of messages containing signatures' })
}
export default MCFinish
