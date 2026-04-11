# LendSmart Blockchain

This directory contains all smart contract code for the LendSmart platform, organised into two toolchains:

```
blockchain/
├── contracts/          # Hardhat contracts (primary, Solidity ^0.8.20)
│   ├── LendSmartLoan.sol   – Main lending contract
│   ├── LoanContract.sol    – P2P loan agreement contract
│   ├── Lock.sol            – Time-lock utility contract
│   └── MockERC20.sol       – ERC-20 mock for testing
├── scripts/            # Hardhat deployment scripts
├── test/               # Hardhat test suite (ethers.js / Mocha)
├── ignition/           # Hardhat Ignition deployment modules
├── hardhat.config.js   # Hardhat configuration (Solidity 0.8.28)
├── package.json
│
└── truffle/            # Legacy Truffle toolchain (Solidity 0.8.17)
    ├── contracts/          – BorrowerContract.sol, LoanManager.sol
    ├── migrations/         – Truffle migration scripts
    ├── build/              – Compiled contract artifacts
    └── truffle-config.js   – Truffle configuration
```

## Quick Start (Hardhat)

```bash
cd blockchain
npm install
npx hardhat compile
npx hardhat test
npx hardhat run scripts/deploy.js --network localhost
```

## Quick Start (Truffle – legacy)

```bash
cd blockchain/truffle
npm install -g truffle
truffle compile
truffle migrate --network development
```
