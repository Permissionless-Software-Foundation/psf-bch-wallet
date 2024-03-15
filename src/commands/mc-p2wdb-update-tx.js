import bitcore from "bitcore-lib-cash";
import EncryptLib from "bch-encrypt-lib/index.js";
import p2wdb from "p2wdb";
import Conf from "conf";
import axios from "axios";
import WalletUtil from "../lib/wallet-util.js";
import MCCollectKeys from "./mc-collect-keys.js";
import command from "@oclif/command";
const { Write, Pin } = p2wdb;
// CONSTANTS
// const WRITE_PRICE_ADDR = 'bitcoincash:qqlrzp23w08434twmvr4fxw672whkjy0py26r63g3d'
const WRITE_PRICE_ADDR = 'bitcoincash:qrwe6kxhvu47ve6jvgrf2d93w0q38av7s5xm9xfehr'; // test address
// Update this constant to reflect the Group token uses to generate the Minting
// Council NFTs.
const GROUP_ID = '8e8d90ebdb1791d58eba7acd428ff3b1e21c47fb7aba2ba3b5b815aa0fe7d6d5';
const { Command, flags } = command;
class MCP2wdbUpdateTx extends Command {
    constructor(argv, config) {
        super(argv, config);
        // Encapsulate dependencies.
        this.walletUtil = new WalletUtil();
        this.wallet = null; // placeholder
        this.bchjs = null; // placeholder
        this.mcCollectKeys = new MCCollectKeys();
        this.Write = Write;
        this.Pin = Pin;
        this.msgLib = null; // placeholder
        this.write = null; // placeholder
        this.pin = null; // placeholder
        this.encryptLib = null; // placeholder
        this.bitcore = bitcore;
        this.conf = new Conf();
        this.axios = axios;
    }
    async run() {
        try {
            const { flags } = this.parse(MCP2wdbUpdateTx);
            // Validate input flags
            this.validateFlags(flags);
            // Instantiate the Write library.
            await this.instantiateWallet(flags);
            // Look up the public keys for MC NFT holders.
            const keys = await this.getPublicKeys();
            console.log('keys: ', keys);
            // Generate a 50% + 1 multisig wallet.
            const walletObj = this.createMultisigWallet(keys);
            console.log(`wallet object: ${JSON.stringify(walletObj)}`);
            // Instatiate all the libraries orchestrated by this function.
            this.instanceLibs();
            // Calculate the current price of $0.01 USD in PSF tokens
            const p2wdbWritePrice = await this.calcP2wdbWritePrice();
            // Generate update data, upload to IPFS, and get a CID
            const cid = await this.uploadDataToIpfs({ keys, walletObj, p2wdbWritePrice });
            // const cid = 'bafybeiea2rb73y6gkiaxaljpv2hj5hfczpibl634kj6flbz575j4t4bswa'
            console.log('cid: ', cid);
            // Generate an update transaction with the update CID
            const updateTxid = await this.writeCidToBlockchain(cid);
            console.log('updateTxid: ', updateTxid);
            return true;
        }
        catch (err) {
            console.log('Error in mc-update-p2wdb-price.js/run(): ', err.message);
            return 0;
        }
    }
    // Calculate how much $0.01 USD is in PSF tokens.
    async calcP2wdbWritePrice() {
        try {
            const result = await this.axios.get('https://psfoundation.cash/price');
            // console.log('PSF price data: ', result.data)
            let tokensPerPenny = 0.01 / result.data.usdPerToken;
            // Round to 8 decimal points
            tokensPerPenny = this.wallet.bchjs.Util.floor8(tokensPerPenny);
            return tokensPerPenny;
        }
        catch (err) {
            console.log('Error in calcP2wdbWritePrice(): ', err);
            throw err;
        }
    }
    // Generate update data, upload to IPFS, and get a CID as per the PS009 spec.
    async uploadDataToIpfs(inObj = {}) {
        try {
            const { keys, walletObj, p2wdbWritePrice } = inObj;
            const updateTxData = {
                groupId: GROUP_ID,
                keys,
                walletObj,
                multisigAddr: walletObj.address,
                p2wdbWritePrice
            };
            // console.log('updateTxData: ', updateTxData)
            // Upload the data to the P2WDB.
            const p2wdbResult = await this.write.postEntry(updateTxData, 'p2wdb-update');
            console.log('p2wdbResult: ', p2wdbResult);
            const zcid = p2wdbResult.hash;
            // Get a CID from the P2WDB zCID
            const cid = await this.pin.json(zcid);
            console.log('cid: ', cid);
            // Pin the CID with the pinning cluster
            const pinResult = await this.pin.cid(cid);
            console.log('pinResult: ', pinResult);
            return cid;
        }
        catch (err) {
            console.error('Error in uploadDataToIpfs(): ', err.message);
            throw err;
        }
    }
    // This function expects an IPFS CID as input. This is the output of the
    // uploadDataToIpfs() function. It writes the update data CID to the BCH
    // blockchain, and generates the transaction that the Minting Council will
    // approve.
    async writeCidToBlockchain(cid) {
        try {
            // Generate the data for the OP_RETURN
            const now = new Date();
            const opReturnObj = {
                cid,
                ts: now.getTime()
            };
            const opReturnStr = JSON.stringify(opReturnObj);
            // Tag the reference address with dust, so that this TX appears in its
            // TX history.
            const receivers = [{
                    address: WRITE_PRICE_ADDR,
                    amountSat: 546
                }];
            await this.wallet.initialize();
            const txid = await this.wallet.sendOpReturn(opReturnStr, '', receivers);
            console.log('txid: ', txid);
            return txid;
        }
        catch (err) {
            console.error('Error in writeCidToBlockchain(): ', err);
            throw err;
        }
    }
    // Instatiate the various libraries used by msgSend(). These libraries are
    // encasulated in the 'this' object.
    instanceLibs() {
        // Instantiate the bch-message-lib library.
        this.msgLib = this.walletUtil.instanceMsgLib(this.wallet);
        // Get the selected P2WDB server URL
        const serverURL = this.walletUtil.getP2wdbServer();
        const pinServer = this.walletUtil.getPinServer();
        // Instatiate the P2WDB Write and Pin libraries.
        const p2wdbConfig = {
            bchWallet: this.wallet,
            serverURL,
            pinServer
        };
        this.write = new this.Write(p2wdbConfig);
        this.pin = new this.Pin(p2wdbConfig);
        // Instantiate the encryption library.
        this.encryptLib = new EncryptLib({
            bchjs: this.wallet.bchjs
        });
        return true;
    }
    // Generate a P2SH multisignature wallet from the public keys of the NFT holders.
    createMultisigWallet(keyPairs) {
        try {
            // Isolate just an array of public keys.
            const pubKeys = [];
            for (let i = 0; i < keyPairs.length; i++) {
                const thisPair = keyPairs[i];
                pubKeys.push(thisPair.pubKey);
            }
            // Determine the number of signers. It's 50% + 1
            const requiredSigners = Math.floor(pubKeys.length / 2) + 1;
            // Multisig Address
            const msAddr = new bitcore.Address(pubKeys, requiredSigners);
            // Locking Script in hex representation.
            const scriptHex = new bitcore.Script(msAddr).toHex();
            const walletObj = {
                address: msAddr.toString(),
                scriptHex,
                publicKeys: pubKeys,
                requiredSigners
            };
            return walletObj;
        }
        catch (err) {
            console.error('Error in createMultisigWallet()');
            throw err;
        }
    }
    // Retrieve the public keys for all MC NFT holders.
    async getPublicKeys() {
        try {
            // Collect the NFT token IDs.
            await this.mcCollectKeys.instanceWallet();
            const nfts = await this.mcCollectKeys.getNftsFromGroup();
            // console.log('nfts: ', nfts)
            // Get the address holding each NFT.
            const addrs = await this.mcCollectKeys.getAddrs(nfts);
            // console.log('addrs: ', addrs)
            // Get the public keys for each address holding an NFT.
            const { keys } = await this.mcCollectKeys.findKeys(addrs, nfts);
            return keys;
        }
        catch (err) {
            console.error('Error in getPublicKeys()');
            throw err;
        }
    }
    // Instatiate the wallet library.
    async instantiateWallet(flags) {
        try {
            const { name } = flags;
            // Instantiate the wallet.
            // const wallet = new SlpWallet(undefined, { interface: 'consumer-api' })
            // Instantiate minimal-slp-wallet.
            const wallet = await this.walletUtil.instanceWallet(name);
            // await wallet.walletInfoPromise
            // await wallet.initialize()
            this.wallet = wallet;
            this.bchjs = wallet.bchjs;
            return wallet;
        }
        catch (err) {
            console.error('Error in instantiateWrite()');
            throw err;
        }
    }
    // Validate the proper flags are passed in.
    validateFlags(flags) {
        // Exit if wallet not specified.
        const name = flags.name;
        if (!name || name === '') {
            throw new Error('You must specify a wallet with the -n flag.');
        }
        return true;
    }
}
MCP2wdbUpdateTx.description = `Generate a PS009 Update Transaction to update the P2WDB write price

This command generates an 'Update Transaction' as per PS009 specification:
https://github.com/Permissionless-Software-Foundation/specifications/blob/master/ps009-multisig-approval.md

This command creates a multisig wallet. As input, it takes address-public-key
pairs generated from the multisig-collect-keys command. It uses that
data to construct a P2SH multisig wallet. The wallet object is displayed
on the command line as the output.

This is a long-running command. It does the following:
- It calls the mc-collect-keys commands to get the public keys for each holder
  of the Minting Council NFT.
- It generates a multisignature wallet from those keys requiring 50% + 1 signers.
- It retrieves the current PSF token price and calculates the price of $0.01 USD
  in PSF tokens.
- It writes all the data to the P2WDB, pins the data with the P2WDB Pinning
  Cluster, and gets an IPFS CID for the data.
- It then writes a PS009 Update Transaction to the BCH blockchain, containing
  the CID, returning a TXID.

That BCH TXID is then used as input to the mc-update-p2wdb-price command, to
generate a PS009 Approval Transaction, so that the price update can be approved
by the Minting Council via the multisignature wallet.
`;
MCP2wdbUpdateTx.flags = {
    name: flags.string({ char: 'n', description: 'Name of wallet paying to send messages to NFT holders' })
};
export default MCP2wdbUpdateTx;
