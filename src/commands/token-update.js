import Conf from "conf";
import slpMutableData from "slp-mutable-data";
import WalletUtil from "../lib/wallet-util.js";
import command from "@oclif/command";
// const { Pin, Write } = require('p2wdb')
const { SlpMutableData } = slpMutableData;
const { Command, flags } = command;
class TokenUpdate extends Command {
    constructor(argv, config) {
        super(argv, config);
        // Encapsulate dependencies.
        this.walletUtil = new WalletUtil();
        this.conf = new Conf();
        // this.Pin = Pin
        // this.Write = Write
        this.wallet = null; // placeholder
        this.SlpMutableData = SlpMutableData;
        this.slpMutableData = null; // placeholder
    }
    async run() {
        try {
            const { flags } = this.parse(TokenUpdate);
            // Validate input flags
            this.validateFlags(flags);
            // Instantiate the Write library.
            await this.instantiateSlpData(flags);
            // Generate the transaction to update the mutable data.
            const hex = await this.updateMutableData(flags);
            // console.log('hex: ', hex)
            const txid = await this.walletUtil.broadcastTx(this.wallet, hex);
            console.log(`Mutable data updated with TXID: ${txid}`);
            console.log(`https://blockchair.com/bitcoin-cash/transaction/${txid}`);
            return txid;
        }
        catch (err) {
            console.log('Error in token-update.js/run(): ', err.message);
            return 0;
        }
    }
    // Generates a transaction for updating the mutable data. Returns the transaction
    // in hex string format.
    async updateMutableData(flags) {
        try {
            const cid = flags.cid;
            let cidStr = `ipfs://${cid}`;
            if (cid.includes('ipfs://')) {
                cidStr = cid;
            }
            // console.log('cidStr: ', cidStr)
            const hex = await this.slpMutableData.data.writeCIDToOpReturn(cidStr);
            return hex;
        }
        catch (err) {
            console.error('Error in updateMutableData()');
            throw err;
        }
    }
    // Instatiate the Write library.
    async instantiateSlpData(flags) {
        try {
            // Instantiate the wallet.
            this.wallet = await this.walletUtil.instanceWallet(flags.name);
            // console.log(`wallet.walletInfo: ${JSON.stringify(wallet.walletInfo, null, 2)}`)
            this.slpMutableData = new this.SlpMutableData({ wallet: this.wallet });
            return true;
        }
        catch (err) {
            console.error('Error in instantiateSlpData()');
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
        const cid = flags.cid;
        if (!cid || cid === '') {
            throw new Error('You must specify a CID with the -c flag.');
        }
        return true;
    }
}
TokenUpdate.description = `Update token mutable data.

This command is used to update the mutable data for a token.

Data updates are effected by writing a new
CID to an OP_RETURN inside a transaction, published to the Mutable Data Address
(MDA), as described in PS002.

The wallet used to pay for the transaction must control the MDA, otherwise the
update will be ignored.

To use this command, you'll need a CID that resolves to the updated data.
The p2wdb-json command can be used for that.

New mutable data follows the PS002 spec by uploading JSON data to IPFS and
then including the CID in an OP_RETURN. The JSON data should also follow the
schema in the PS007 specification:

https://github.com/Permissionless-Software-Foundation/specifications/blob/master/ps002-slp-mutable-data.md
https://github.com/Permissionless-Software-Foundation/specifications/blob/master/ps007-token-data-schema.md

`;
TokenUpdate.flags = {
    name: flags.string({ char: 'n', description: 'Name of wallet' }),
    cid: flags.string({
        char: 'c',
        description: 'A CID that resolves to the new mutable data JSON'
    })
};
export default TokenUpdate;
