import command from '@oclif/command'
import EncryptLib from 'bch-encrypt-lib/index.js'
import p2wdb from 'p2wdb'
import bitcore from 'bitcore-lib-cash'
import WalletUtil from '../lib/wallet-util.js'
/*
  Read an e2ee message containing a multisig transaction. Sign your input
  and reply with the signature.
*/
// Global npm libraries
const { Command, flags } = command
const Read = p2wdb.Read
const Write = p2wdb.Write
class MCSignTx extends Command {
  constructor (argv, config) {
    super(argv, config)
    // Encapsulate dependencies
    this.encryptLib = null // placeholder
    this.Read = Read
    this.Write = Write
    this.walletUtil = new WalletUtil()
    this.bitcore = bitcore
  }

  async run () {
    try {
      const { flags } = this.parse(MCSignTx)
      // Validate input flags
      this.validateFlags(flags)
      // Instatiate all the libraries orchestrated by this function.
      await this.instanceLibs(flags)
      const { message, sender } = await this.msgRead(flags)
      console.log('sender: ', sender)
      console.log(`Message:\n${message}`)
      const sig = await this.signTx(message)
      await this.encryptAndUpload({ sig, sender })
      return true
    } catch (error) {
      console.log('Error in multisig-sign.js/run(): ', error)
      return 0
    }
  }

  // Encrypt the message and upload it to the P2WDB.
  async encryptAndUpload (inObj) {
    // const { bchAddress, message } = flags
    const { sig, sender } = inObj
    // Get public Key for reciever from the blockchain.
    const publicKey = await this.bchWallet.getPubKey(sender)
    console.log(`publicKey: ${JSON.stringify(publicKey, null, 2)}`)
    const bchAddress = sender
    console.log(`Sending signature to ${bchAddress} and encrypting with public key ${publicKey}`)
    // Encrypt the message using the recievers public key.
    const encryptedMsg = await this.encryptMsg(publicKey, JSON.stringify(sig))
    console.log(`encryptedMsg: ${JSON.stringify(encryptedMsg, null, 2)}`)
    // Upload the encrypted message to the P2WDB.
    const appId = 'psf-bch-wallet'
    const data = {
      now: new Date(),
      data: encryptedMsg
    }
    const result = await this.write.postEntry(data, appId)
    console.log(`Data about P2WDB write: ${JSON.stringify(result, null, 2)}`)
    const hash = result.hash
    // Wait a couple seconds to let the indexer update its UTXO state.
    await this.bchWallet.bchjs.Util.sleep(2000)
    // Update the UTXO store in the wallet.
    await this.bchWallet.getUtxos()
    const subject = `signature from ${this.bchWallet.walletInfo.cashAddress}`
    // Sign Message
    const txHex = await this.signalMessage(hash, bchAddress, subject)
    // Broadcast Transaction
    const txidStr = await this.bchWallet.broadcast(txHex)
    console.log(`Transaction ID : ${JSON.stringify(txidStr, null, 2)}`)
    console.log(' ')
    return true
  }

  // Encrypt a message using encryptLib
  async encryptMsg (pubKey, msg) {
    try {
      // Input validation
      if (!pubKey || typeof pubKey !== 'string') {
        throw new Error('pubKey must be a string')
      }
      if (!msg || typeof msg !== 'string') {
        throw new Error('msg must be a string')
      }
      const buff = Buffer.from(msg)
      const hex = buff.toString('hex')
      const encryptedStr = await this.encryptLib.encryption.encryptFile(pubKey, hex)
      // console.log(`encryptedStr: ${JSON.stringify(encryptedStr, null, 2)}`)
      return encryptedStr
    } catch (error) {
      console.log('Error in encryptMsg()')
      throw error
    }
  }

  // Generate a PS001 signal message to write to the blockchain.
  // https://github.com/Permissionless-Software-Foundation/specifications/blob/master/ps001-media-sharing.md
  async signalMessage (hash, bchAddress, subject) {
    try {
      if (!hash || typeof hash !== 'string') {
        throw new Error('hash must be a string')
      }
      if (!bchAddress || typeof bchAddress !== 'string') {
        throw new Error('bchAddress must be a string')
      }
      if (!subject || typeof subject !== 'string') {
        throw new Error('subject must be a string')
      }
      // Generate the hex transaction containing the PS001 message signal.
      const txHex = await this.msgLib.memo.writeMsgSignal(hash, [bchAddress], subject)
      if (!txHex) {
        throw new Error('Could not build a hex transaction')
      }
      return txHex
    } catch (error) {
      console.log('Error in signalMessage')
      throw error
    }
  }

  // Find an input that matches the private key controlled by this wallet, then
  // sign it and return the signature.
  async signTx (message) {
    try {
      // Convert from JSON string to an Object
      const msg = JSON.parse(message)
      const txObj = msg.txObj
      // console.log(`txObj: ${JSON.stringify(txObj, null, 2)}`)
      // Bob converts the object into a Transaction class.
      const tx = new this.bitcore.Transaction(txObj)
      const privateKey = this.bchWallet.walletInfo.privateKey
      // Sign the transaction with Bob's key.
      const partiallySignedTx = tx.sign(new bitcore.PrivateKey(privateKey))
      // Get Bob's signature from the transaction
      let sig = partiallySignedTx.getSignatures(privateKey)
      // Convert Bob's signature into an object and pass it to Sam.
      sig = sig[0].toObject()
      console.log('signature: ', sig)
      return sig
    } catch (error) {
      console.log('Error in signTx()')
      throw error
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
      // Get TX Data
      const txDataResult = await this.bchWallet.getTxData([txid])
      const txData = txDataResult[0]
      console.log(`txData: ${JSON.stringify(txData, null, 2)}`)
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

  // Validate the proper flags are passed in.
  validateFlags (flags) {
    // Exit if wallet not specified.
    const txid = flags.txid
    const name = flags.name
    if (!txid || txid === '') {
      throw new Error('You must specify a txid with the -t flag.')
    }
    if (!name || name === '') {
      throw new Error('You must specify a wallet with the -n flag.')
    }
    return true
  }
}
MCSignTx.description = `Read signed messages

This command signs a multisig transaction for Minting Council members. The
mc-read-tx command should be run *before* this command, so that you can
read the context of the transaction.

After signing the transaction, it will send the signature back to the message
originator.
`
MCSignTx.flags = {
  name: flags.string({ char: 'n', description: 'Name of wallet' }),
  txid: flags.string({ char: 't', description: 'Transaction ID' })
}
export default MCSignTx
