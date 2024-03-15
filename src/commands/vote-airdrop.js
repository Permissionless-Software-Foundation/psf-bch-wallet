import Conf from "conf";
import p2wdb from "p2wdb";
import WalletUtil from "../lib/wallet-util.js";
import command from "@oclif/command";
const { Pin, Write } = p2wdb;
const { Command, flags } = command;
class VoteAirdrop extends Command {
    constructor(argv, config) {
        super(argv, config);
        // Encapsulate dependencies.
        this.walletUtil = new WalletUtil();
        this.conf = new Conf();
        this.Pin = Pin;
        this.Write = Write;
        this.wallet = null; // placeholder
    }
    async run() {
        try {
            const { flags } = this.parse(VoteAirdrop);
            // Validate input flags
            this.validateFlags(flags);
            // Instantiate the Write library.
            await this.instantiateWallet(flags);
            await this.airdrop(flags);
            return true;
        }
        catch (err) {
            console.log('Error in p2wdb-pin.js/run(): ', err.message);
            return 0;
        }
    }
    // Loop through each address in the list and send a token to each one.
    async airdrop(flags) {
        try {
            const addrs = JSON.parse(flags.addrs);
            for (let i = 0; i < addrs.length; i++) {
                const thisAddr = addrs[i];
                console.log(`Sending a token to address: ${thisAddr}`);
                const receiver = {
                    address: thisAddr,
                    tokenId: flags.tokenId,
                    qty: 1
                };
                const txid = await this.wallet.sendTokens(receiver, 5);
                console.log(`Token sent. TXID: ${txid}`);
                // Wait three seconds for indexers to update and txs to broadcast.
                await this.wallet.bchjs.Util.sleep(3000);
                // Update the wallet UTXOs.
                await this.wallet.initialize();
            }
            return true;
        }
        catch (err) {
            console.error('Error in airdrop()');
            throw err;
        }
    }
    // Instatiate the wallet library.
    async instantiateWallet(flags) {
        try {
            // Instantiate the wallet.
            this.wallet = await this.walletUtil.instanceWallet(flags.name);
            // console.log(`wallet.walletInfo: ${JSON.stringify(wallet.walletInfo, null, 2)}`)
            return true;
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
        const addrs = flags.addrs;
        if (!addrs || addrs === '') {
            throw new Error('You must specify a list of addresses with the -a flag.');
        }
        const tokenId = flags.tokenId;
        if (!tokenId || tokenId === '') {
            throw new Error('You must specify a Token ID with the -t flag.');
        }
        return true;
    }
}
VoteAirdrop.description = `Airdrop Voting Tokens

This command is used to air-drop voting tokens to an array of addresses. It
is expected the array of addresses is generated from the vote-addrs command.
One token will be sent to each address in the list.
`;
VoteAirdrop.flags = {
    name: flags.string({ char: 'n', description: 'Name of wallet holding voting tokens' }),
    addrs: flags.string({ char: 'a', description: 'JSON string containing array of addresses' }),
    tokenId: flags.string({ char: 't', description: 'Token ID to air-drop to each address' })
};
export default VoteAirdrop;
