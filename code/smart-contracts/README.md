# LendSmart Smart Contracts

This directory contains the Solidity smart contracts for the LendSmart platform.

## Overview

The primary smart contract, `LoanContract.sol`, manages the lifecycle of loans on the blockchain. This includes loan creation, funding by lenders, disbursement of funds to borrowers, repayments, and handling of defaults.

Future contracts might include:

- A reputation or identity contract for users.
- A stablecoin integration contract.
- Governance contracts for platform parameters.

## Contracts

- **`contracts/LoanContract.sol`**: The main contract for managing loan agreements between borrowers and lenders.
  - Allows borrowers to request loans.
  - Allows lenders to fund open loan requests.
  - Manages fund disbursement upon successful funding.
  - Tracks repayment schedules and processes repayments.
  - Handles loan defaults and collateral (if applicable and on-chain).
- **`contracts/Migrations.sol`**: Standard Truffle/Hardhat migrations contract (if using these frameworks).

## Project Structure

```
smart-contracts/
├── contracts/          # Solidity smart contract files (.sol)
│   └── LoanContract.sol
├── migrations/         # Migration scripts (if using Truffle)
├── scripts/            # Deployment and interaction scripts (e.g., for Hardhat or ethers.js)
│   ├── deploy.js
│   └── verify.js
├── test/               # Test files for smart contracts (e.g., JavaScript/TypeScript tests)
│   └── LoanContract.test.js
├── hardhat.config.js   # Hardhat configuration (if using Hardhat)
├── truffle-config.js   # Truffle configuration (if using Truffle)
├── package.json        # Project dependencies (e.g., Hardhat, Ethers.js, OpenZeppelin)
├── .env.example        # Example environment variables for deployment (RPC URLs, private keys)
└── README.md           # This file
```

## Prerequisites

- Node.js (v18.x or later recommended)
- npm or yarn
- A development environment for Solidity (e.g., Hardhat, Truffle)

## Setup and Installation (Example using Hardhat)

1.  **Navigate to the `smart-contracts` directory:**

    ```bash
    cd LendSmart/smart-contracts
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    # or
    # yarn install
    ```

    Common dependencies include:
    - `hardhat`
    - `@nomicfoundation/hardhat-toolbox` (includes ethers, chai, etc.)
    - `@openzeppelin/contracts` (for reusable and secure contract components)
    - `dotenv` (for managing environment variables)

3.  **Set up environment variables:**
    Create a `.env` file in the `smart-contracts` directory by copying `.env.example`:
    ```bash
    cp .env.example .env
    ```
    Update the `.env` file with your specific configurations:
    ```
    SEPOLIA_RPC_URL=your_sepolia_rpc_url
    PRIVATE_KEY=your_blockchain_private_key_for_deployment
    ETHERSCAN_API_KEY=your_etherscan_api_key_for_verification
    ```

## Development Workflow (Example using Hardhat)

1.  **Compile Contracts:**

    ```bash
    npx hardhat compile
    ```

2.  **Run Tests:**

    ```bash
    npx hardhat test
    ```

    Tests are typically located in the `test/` directory (e.g., `LoanContract.test.js`).

3.  **Deploy Contracts:**
    - **To a local Hardhat network:**
      ```bash
      npx hardhat node # Starts a local node
      # In another terminal:
      npx hardhat run scripts/deploy.js --network localhost
      ```
    - **To a testnet (e.g., Sepolia):**
      Ensure your `hardhat.config.js` is configured for the testnet and your `.env` file has the RPC URL and private key.
      ```bash
      npx hardhat run scripts/deploy.js --network sepolia
      ```
      The `deploy.js` script should output the address of the deployed contract.

4.  **Verify Contracts on Etherscan (or similar block explorer):**
    After deploying to a public testnet or mainnet, you can verify the contract source code.
    ```bash
    npx hardhat verify --network sepolia DEPLOYED_CONTRACT_ADDRESS "Constructor Argument 1" "Constructor Argument 2"
    # Or use a custom script: scripts/verify.js
    ```

## Interacting with Contracts

Once deployed, contracts can be interacted with using libraries like Ethers.js or Web3.js from the backend or frontend applications, or directly via Hardhat tasks/scripts.

## Key Considerations

- **Security:** Smart contracts handle valuable assets and must be developed with security as the top priority. Use established patterns, conduct thorough testing, and consider security audits for production deployments.
- **Gas Optimization:** Blockchain transactions cost gas. Write efficient Solidity code to minimize gas consumption.
- **Upgradability:** Consider using proxy patterns (e.g., OpenZeppelin Upgrades Plugins) if you anticipate needing to upgrade contract logic in the future without migrating data.
- **Oracles:** If your contracts need real-world data (e.g., fiat currency prices), you will need to integrate with a reliable oracle service.

## License

This project is licensed under the [Specify License, e.g., MIT License] - see the `LICENSE` file in the root project directory for details.
