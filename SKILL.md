---
name: psf-bch-wallet
description: Create and manage BCH and SLP token wallets from the command line using psf-bch-wallet v3 — receive/send BCH, send SLP tokens, sweep WIF private keys, and sign/verify messages. Use for any wallet, payment, or BCH/SLP transfer task with this CLI.
---

# psf-bch-wallet — agent skill

This is a template CLI wallet for Bitcoin Cash (BCH) and SLP tokens. It is built on
`minimal-slp-wallet` and meant to be forked to build specialized CLI wallet apps.
This skill is maintained by the Cash Stack agent (Sam). To update it, edit `SKILL.md`
in this repository and keep it in sync with the actual commands in `psf-bch-wallet.js`.

## Requirements & install

- Node.js v20 or higher
- `git clone https://github.com/Permissionless-Software-Foundation/psf-bch-wallet`
- `cd psf-bch-wallet && npm install`
- `cp .env.example .env` (defaults work out of the box)

The default backend is the Cash Stack consumer API (`https://free-bch.fullstack.cash`,
`INTERFACE=consumer-api`). For the web-2 stack, set `INTERFACE=rest-api` in `.env`.

## Wallet storage

Wallets are stored as JSON files in `.wallets/<name>.json`. **These files contain the
wallet's mnemonic seed phrase — treat them as private keys.** The directory is gitignored.
Never commit, print, paste, or exfiltrate the mnemonic or the wallet JSON.

Wallet files follow this shape (fields created by `minimal-slp-wallet`):

```json
{ "wallet": { "mnemonic": "...", "hdPath": "...", "cashAddress": "...", "slpAddress": "...", "legacyAddress": "...", "description": "..." } }
```

## Wallet derivation & coin types (SLIP-0044)

BIP-44 level 2 coin types per SLIP-0044 (https://github.com/satoshilabs/slips/blob/master/slip-0044.md):

- **145 = Bitcoin Cash (BCH)** — registered standard for BCH addresses, e.g. `m/44'/145'/0'/0/0`
- **245 = Simple Ledger Protocol (SLP)** — for SLP token wallets, e.g. `m/44'/245'/0'/0/0`

`minimal-slp-wallet` defaults its `hdPath` to **245** (SLP-oriented). A single mnemonic therefore
derives DIFFERENT BCH addresses at 145 vs 245. When importing an existing wallet, verify the
address against both paths (plus coin type 0) before assuming a key mismatch.

## Commands

Run with `node psf-bch-wallet.js <command>`. Use `help` for the full list.

### Create and list wallets

```bash
node psf-bch-wallet.js wallet-create -n wallet1 -d "My first wallet"
node psf-bch-wallet.js wallet-list
```

- `-n` wallet name (required by every wallet command) · `-d` description (optional).
- `.wallets/<name>.json` holds the wallet; keys are generated locally (no network needed).

### Receive funds

```bash
node psf-bch-wallet.js wallet-addrs -n wallet1
```

Prints the **Cash Address** (`bitcoincash:...`), **SLP Address** (`simpleledger:...`) and
**Legacy Address** (`1...`). Share the Cash Address to receive BCH, SLP address for tokens.

### Balances

```bash
node psf-bch-wallet.js wallet-balance -n wallet1
```

Shows the total BCH balance (BCH and sats) plus a breakdown of SLP Type-1/Group/NFT token
holdings and minting batons.

### Send BCH

```bash
node psf-bch-wallet.js send-bch -n wallet1 -q 0.00001 -a bitcoincash:qr2zqrnqdulfmeqs2qe9c5p605lrwe90v5v735s2jl
```

- `-q` quantity in whole BCH (e.g. `0.00001`) · `-a` destination address.
- Prints the TXID and an explorer link (`https://bch.loping.net/tx/<txid>`).
- **Note:** `minimal-slp-wallet` automatically appends a **2,000-sat PSF donation output** to
  every BCH send (cash flow (a)) — the tx has recipient + donation + change. This is by design;
  account for it in fee/amount math.

### Verify a transaction on-chain

The printed explorer link (`bch.loping.net`) may be bot-blocked from some IPs. Use the same
Cash Stack consumer API the wallet talks to instead:

```bash
# confirm a tx + block height for an address
curl -s -X POST https://free-bch.fullstack.cash/bch/txHistory \
  -H 'Content-Type: application/json' \
  -d '{"address":"bitcoincash:...","sortingOrder":"DESCENDING","limit":5}'

# full vin/vout autopsy for one or more txids
curl -s -X POST https://free-bch.fullstack.cash/bch/txData \
  -H 'Content-Type: application/json' \
  -d '{"txids":["<txid>"]}'
```

### Send SLP tokens

```bash
node psf-bch-wallet.js send-tokens -n wallet1 -q 0.5 -a simpleledger:qrnwvazrjzytmlv9wyvj4pkkc9k2l0fhvs8u479asy -t 38e97c5d7d3585a2cbf3f9580c82ca33985f9cb0845d4dcce220cb709f9538b0
```

- `-q` token quantity · `-a` SLP destination · `-t` token ID.

### Sweep a private key (WIF)

```bash
node psf-bch-wallet.js wallet-sweep -n wallet1 -w <WIF-private-key>
```

Moves all funds from a WIF private key into a named wallet. Useful for moving funds out
of exposed or inherited keys.

### Sign & verify messages

```bash
node psf-bch-wallet.js msg-sign -n wallet1 -m "test message"
node psf-bch-wallet.js msg-verify -a <addr> -m "test message" -s <signature>
```

Proves ownership of an address without revealing the private key.

## Extending (this is a template)

Each command is a class in `src/commands/` with:

- `async run(flags)` — main entry, always wrapped in try/catch that prints errors.
- `validateFlags(flags)` — input validation, run first.
- Options are registered in `psf-bch-wallet.js` via the `commander` `program.command(...)`.

Add a command: create `src/commands/<name>.js`, export the class, import and instantiate it
in `psf-bch-wallet.js`, and add `.option(...)` definitions. Run unit tests with
`npm test` (mocha in `test/unit/commands/`).

## Troubleshooting

- **Network errors on balance/send:** the default API host is unreachable. Set
  `WALLET_URL` and/or `INTERFACE` in `.env` to point at another Cash Stack node.
- **Insufficient funds on send:** you may have dust UTXOs; sweep or consolidate first.
- **Mismatched address format:** the wallet accepts cash / legacy / SLP formats for BCH;
  use the SLP format for token transfers.
- **Broadcast rejected (HTTP 431 / ECONNRESET):** the Cash Stack consumer API drops
  txs with more than ~50 inputs. Consolidating or sweeping many dust UTXOs must be
  chunked to ~50 inputs per tx (e.g. a `--chunk-size`-style control), or use a smaller
  chunk size if the API still resets.
- **Consolidation fee reality:** minimal-slp-wallet charges ~148 sats per input plus base
  fee and always appends the 2,000-sat PSF donation. Sweeping hundreds of dust UTXOs
  costs tens of thousands of sats in miner fees; the donation output returns to the
  wallet's own address and remains in-wallet.

## Change history

v3 (this repo) is a full rewrite: ESM modules and Commander.js, replacing the v2 CommonJS
+ oclif codebase. v2 is archived in `psf-bch-wallet-v2`. Version 3 is simpler on purpose —
it is the forking base for specialized CLI wallet apps.
