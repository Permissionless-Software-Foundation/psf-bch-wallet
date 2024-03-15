import { promises } from "fs";
import command from "@oclif/command";

const fs = { promises }.promises;
const { Command, flags } = command;

// Hack to get __dirname back.
// https://blog.logrocket.com/alternatives-dirname-node-js-es-modules/
import * as url from 'url'
const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

class WalletRemove extends Command {
    async run() {
        const { flags } = this.parse(WalletRemove);
        // Validate input flags
        this.validateFlags(flags);
        // const filename = `${__dirname.toString()}/../../.wallets/${flags.name}.json`
        const filename = this.getFilePath(flags.name);
        return this.removeWallet(filename);
    }
    getFilePath(walletName) {
        const filename = `${__dirname.toString()}/../../.wallets/${walletName}.json`;
        return filename;
    }
    async removeWallet(filename) {
        await fs.rm(filename);
        return true;
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
WalletRemove.description = 'Remove an existing wallet.';
WalletRemove.flags = {
    name: flags.string({ char: 'n', description: 'Name of wallet' })
};
export default WalletRemove;
