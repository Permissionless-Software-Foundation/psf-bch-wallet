import SlpWallet from "minimal-slp-wallet";
import command from "@oclif/command";
// Local libraries
// Constants
// const GROUP_ID = 'd89386b31c46ef977e6bae8e5a8b5770d02e9c3ee50fea5d4805490a5f17c5f3'
const GROUP_ID = '5c8cb997cce61426b7149a74a3997443ec7eb738c5c246d9cfe70185a6911476';
const TOKENS_TO_IGNORE = [
    'f212a3ab2141dcd34f7e800253f1a61344523e6886fdfa2421bbedf3aa52617a',
    'c94f12a76105fa6f46bafecc95d83c6fcbb051ad61349d7de5aa397f7f7794eb' // Accidentally sent to unrecoverable address.
];
const { Command } = command;
class VoteAddrs extends Command {
    constructor(argv, config) {
        super(argv, config);
        // Encapsulate dependencies.
        this.wallet = null; // placeholder
        this.TOKENS_TO_IGNORE = TOKENS_TO_IGNORE;
    }
    async run() {
        try {
            this.wallet = await this.instanceWallet();
            const nfts = await this.getNftsFromGroup();
            console.log('nfts: ', nfts);
            const addrs = await this.getAddrs(nfts);
            console.log('addrs: ', addrs);
            console.log('Stringified addresses:');
            console.log(`${JSON.stringify(addrs)}`);
            return true;
        }
        catch (err) {
            console.log('Error in vote-addrs.js/run(): ', err.message);
            return 0;
        }
    }
    // This function expects an array of strings as input. Each element is expected
    // to be the Token ID of the an NFT. The address holding each NFT is looked up.
    // TODO: The array of addresses are filtered for duplicates, before being returned.
    async getAddrs(nfts) {
        try {
            let addrs = [];
            for (let i = 0; i < nfts.length; i++) {
                // for (let i = 0; i < 1; i++) {
                const thisNft = nfts[i];
                const nftData = await this.wallet.getTokenData(thisNft, true);
                // console.log('nftData: ', nftData)
                addrs.push(nftData.genesisData.nftHolder);
            }
            // Remove duplicates
            addrs = [...new Set(addrs)];
            return addrs;
        }
        catch (err) {
            console.error('Error in getAddrs(): ', err.message);
            throw err;
        }
    }
    // Retrieve a list of NFTs from the Group token that spawned them.
    async getNftsFromGroup() {
        try {
            const groupData = await this.wallet.getTokenData(GROUP_ID);
            // console.log('groupData: ', groupData)
            const nfts = groupData.genesisData.nfts;
            // Filter out any tokens from the ignore list.
            const filteredNfts = [];
            for (let i = 0; i < nfts.length; i++) {
                const thisNft = nfts[i];
                let ignoreThisToken = false;
                for (let j = 0; j < this.TOKENS_TO_IGNORE.length; j++) {
                    const tokenToIgnore = this.TOKENS_TO_IGNORE[j];
                    if (thisNft.includes(tokenToIgnore)) {
                        ignoreThisToken = true;
                        break;
                    }
                }
                if (!ignoreThisToken) {
                    filteredNfts.push(thisNft);
                }
            }
            return filteredNfts;
        }
        catch (err) {
            console.error('Error in getNftsFromGroup(): ', err.message);
            throw err;
        }
    }
    // Instantiate the wallet library, which is used to interrogate the indexers
    // and retrieve the NFT info.
    async instanceWallet() {
        const wallet = new SlpWallet(undefined, { interface: 'consumer-api' });
        await wallet.walletInfoPromise;
        this.wallet = wallet;
        return wallet;
    }
}
VoteAddrs.description = `Collect Voting Addresses

This command is run to prepare for a governance vote. It looks up the addresses
holding all NFTs tied to a common group token. This list of addresses can
then be used to air-drop voting tokens.
`;
export default VoteAddrs;
