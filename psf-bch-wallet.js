/*
  This is the primary entry point for the psf-bch-wallet CLI app.
  This app uses commander.js.
*/

// Global npm libraries
import { Command } from 'commander'

// Local libraries
import Bar from './commands/bar.js'


// Instantiate the subcommands
const bar = new Bar()

const program = new Command();

program
  // Define the psf-bch-wallet app options
  .name('psf-bch-wallet')
  .description('A command-line BCH and SLP token wallet.')

  // Define the foo command
  .command('foo <name> [destination]', 'Run the foo command', {executableFile: './commands/foo.js'})

  // Define the bar command
  .command('bar')
  .description('Open a wallet named with -n <name>')
  .option('-n, --name <string>', 'wallet name')
  .action(bar.run)

program.parseAsync(process.argv);
