# psf-bch-wallet

This is the third major version (v3) of psf-bch-wallet command-line wallet for Bitcoin Cash (BCH) and SLP tokens.

Version 2 is archived in the [psf-bch-wallet-v2](https://github.com/Permissionless-Software-Foundation/psf-bch-wallet-v2) repository.

## Installation

This software requires node.js v20 or higher. Instructions for installation:

- `git clone https://github.com/Permissionless-Software-Foundation/psf-bch-wallet`
- `cd psf-bch-wallet`
- `npm install`

## Usage

### Display Help

- `node psf-bch-wallet.js help`

### Create a Wallet

Create a new BCH wallet:

- `node psf-bch-wallet.js wallet-create -n wallet1 -d "My first wallet"`

#### Arguments
- Use the `-n` flag to give your wallet a name (required).
- And the `-d` flag to give it a description (optional).

## Change History

psf-bch-wallet v2 became too large in scope and as a result the code base grew too complex. The code was also stuck in CommonJS format. Version 3 uses ESM format, and strives to create a much simpler code base, which can be forked to add on new use-cases and thereby grow in scope in a more controlled fashion.

v2 also used the [oclif CLI framework](https://oclif.io/), which no longer provides good support for JavaScript-native software. v3 has switched to the [Commander.js](https://github.com/tj/commander.js/) library.
