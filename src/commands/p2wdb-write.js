import Conf from "conf";
import p2wdb from "p2wdb";
import WalletUtil from "../lib/wallet-util.js";
import command from "@oclif/command";
const { Write } = p2wdb;
const { Command, flags } = command;
class P2WDBWrite extends Command {
    constructor(argv, config) {
        super(argv, config);
        // Encapsulate dependencies.
        this.walletUtil = new WalletUtil();
        this.conf = new Conf();
        this.Write = Write;
    }
    async run() {
        try {
            const { flags } = this.parse(P2WDBWrite);
            // Validate input flags
            this.validateFlags(flags);
            // Instantiate the Write library.
            await this.instantiateWrite(flags);
            const cid = await this.writeData(flags);
            console.log(cid);
            console.log(`https://p2wdb.fullstack.cash/entry/hash/${cid}`);
            return cid;
        }
        catch (err) {
            console.log('Error in p2wdb-write.js/run(): ', err.message);
            return 0;
        }
    }
    // Instatiate the Write library.
    async instantiateWrite(flags) {
        try {
            // Instantiate the wallet.
            const wallet = await this.walletUtil.instanceWallet(flags.name);
            // console.log(`wallet.walletInfo: ${JSON.stringify(wallet.walletInfo, null, 2)}`)
            // Get the P2WDB server.
            const p2wdbServer = this.walletUtil.getP2wdbServer();
            // Get the REST URL
            const server = this.walletUtil.getRestServer();
            // Instantiate the Write library.
            this.write = new this.Write({
                bchWallet: wallet,
                serverURL: p2wdbServer,
                interface: server.interface,
                restURL: server.restURL
            });
            return true;
        }
        catch (err) {
            console.error('Error in instantiateWrite()');
            throw err;
        }
    }
    // Instantiate the p2wdb Write library and write the data to the P2WDB.
    async writeData(flags) {
        try {
            // Write data to the P2WDB.
            const result = await this.write.postEntry(flags.data, flags.appId);
            // console.log('result: ', result)
            let hash = '';
            if (result.hash.hash) {
                hash = result.hash.hash;
            }
            else {
                hash = result.hash;
            }
            return hash;
        }
        catch (err) {
            console.error('Error in writeData(): ', err);
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
        const data = flags.data;
        if (!data || data === '') {
            throw new Error('You must specify a string of data with the -d flag.');
        }
        const appId = flags.appId;
        if (!appId || appId === '') {
            throw new Error('You must specify an appId with the -a flag.');
        }
        return true;
    }
}
P2WDBWrite.description = `Write an entry to the pay-to-write database (P2WDB)

In order to execute this command, the wallet must contain some BCH and some PSF
token, in order to pay for the write to the P2WDB.
`;
P2WDBWrite.flags = {
    name: flags.string({ char: 'n', description: 'Name of wallet' }),
    data: flags.string({
        char: 'd',
        description: 'String of data to write to the P2WDB'
    }),
    appId: flags.string({
        char: 'a',
        description: 'appId string to categorize data'
    })
};
export default P2WDBWrite;
