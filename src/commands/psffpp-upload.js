import axios from "axios";
import WalletUtil from "../lib/wallet-util.js";
import command from "@oclif/command";
const { Command, flags } = command;
class IpfsUpload extends Command {
    constructor(argv, config) {
        super(argv, config);
        // Encapsulate dependencies.
        this.axios = axios;
        this.walletUtil = new WalletUtil();
    }
    async run() {
        try {
            const { flags } = this.parse(IpfsUpload);
            const server = this.walletUtil.getRestServer();
            const result = await this.axios.post(`${server.restURL}/ipfs/upload`, {
                path: `${__dirname.toString()}/../../ipfs-files`,
                fileName: flags.fileName
            });
            console.log(`upload result: ${JSON.stringify(result.data, null, 2)}`);
            return true;
        }
        catch (err) {
            console.log('Error in run(): ', err);
            return false;
        }
    }
}
IpfsUpload.description = 'Upload a file to the IPFS node';
IpfsUpload.flags = {
    fileName: flags.string({
        char: 'f',
        description: 'filename to upload'
    })
};
export default IpfsUpload;
