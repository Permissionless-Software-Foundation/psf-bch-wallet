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
  .name('psf-bch-wallet')
  .description('A command-line BCH and SLP token wallet.')
  .command('foo <name> [destination]', 'Run the foo command', {executableFile: './commands/foo.js'})
  // .command('bar <name> [destination]', 'Run the bar command', {executableFile: './commands/bar.js'})
  .command('bar')
  .description('Open a wallet named with -n <name>')
  // .argument('<name>')
  .option('-n, --name <string>', 'wallet name')
  .action(bar.run)

// program.command('foo')
//   .description('Split a string into substrings and display as an array')
//   .argument('<string>', 'string to split')
//   .option('--first', 'display just the first substring')
//   .option('-s, --separator <char>', 'separator character', ',')
//   .action((str, options) => {
//     const limit = options.first ? 1 : undefined;
//     console.log(str.split(options.separator, limit));
//   });
//
//   program.command('bar')
//     .description('Split a string into substrings and display as an array')
//     .argument('<string>', 'string to split')
//     .option('--first', 'display just the first substring')
//     .option('-s, --separator <char>', 'separator character', ',')
//     .action((str, options) => {
//       const limit = options.first ? 1 : undefined;
//       console.log(str.split(options.separator, limit));
//     });

program.parseAsync(process.argv);
