import axios from "axios";
import WalletUtil from "../lib/wallet-util.js";
import command from "@oclif/command";
const { Command, flags } = command;
class IpfsConnect extends Command {
    constructor(argv, config) {
        super(argv, config);
        // Encapsulate dependencies.
        this.axios = axios;
        this.walletUtil = new WalletUtil();
    }
    async run() {
        try {
            const { flags } = this.parse(IpfsConnect);
            const server = this.walletUtil.getRestServer();
            const result = await this.axios.post(`${server.restURL}/ipfs/connect`, {
                multiaddr: flags.multiaddr,
                getDetails: flags.getDetails
            });
            // console.log("result.data: ", result.data);
            if (result.data.success) {
                console.log(`Successfully connected to IPFS node at ${flags.multiaddr}`);
            }
            else {
                console.log(`Failed to connect to IPFS node at ${flags.multiaddr}`);
                if (flags.getDetails) {
                    console.log(`Failure reason: ${result.data.details}`);
                }
            }
            return result.data.success;
        }
        catch (err) {
            console.log('Error in run(): ', err);
            return false;
        }
    }
}
IpfsConnect.description = 'Connect to an IPFS peer';
IpfsConnect.flags = {
    multiaddr: flags.string({
        char: 'm',
        description: 'multiaddr to connect to an IPFS node'
    }),
    getDetails: flags.boolean({
        char: 'd',
        description: 'include details about the connection'
    })
};
export default IpfsConnect;
