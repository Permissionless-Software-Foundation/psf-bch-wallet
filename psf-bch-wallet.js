/*
  This is the primary entry point for the psf-bch-wallet CLI app.
  This app uses commander.js.
*/

// Global npm libraries
import { Command } from 'commander'

// Local libraries
import Bar from './commands/bar.js'
import WalletCreate from './commands/wallet-create.js'


// Instantiate the subcommands
const bar = new Bar()
const walletCreate = new WalletCreate()

const program = new Command();

program
  // Define the psf-bch-wallet app options
  .name('psf-bch-wallet')
  .description('A command-line BCH and SLP token wallet.')

  // Define the foo command
  program.command('foo <name> [destination]', 'Run the foo command', {executableFile: './commands/foo.js'})

  // Define the bar command
  program.command('bar')
  .description('Open a wallet named with -n <name>')
  .option('-n, --name <string>', 'wallet name')
  .option('-d --description <string>', 'what the wallet is being used for' )
  .action(bar.run)

  // Define the wallet-create command
  program.command('wallet-create')
  .description('Create a new wallet with name (-n <name>) and description (-d)')
  .option('-n, --name <string>', 'wallet name')
  .option('-d --description <string>', 'what the wallet is being used for' )
  .action(walletCreate.run)

program.parseAsync(process.argv);
