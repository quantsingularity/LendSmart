# Blockchain Documentation

This document provides comprehensive information about the blockchain components of the LendSmart platform.

## Table of Contents

- [Overview](#overview)
- [Smart Contract Architecture](#smart-contract-architecture)
- [Contract Deployment](#contract-deployment)
- [Contract Interaction](#contract-interaction)
- [Security Considerations](#security-considerations)
- [Gas Optimization](#gas-optimization)
- [Testing and Verification](#testing-and-verification)
- [Upgradeability](#upgradeability)
- [Blockchain Integration](#blockchain-integration)

## Overview

LendSmart leverages blockchain technology to provide transparent, secure, and automated peer-to-peer lending. The platform uses Ethereum/Polygon smart contracts to handle loan agreements, fund disbursement, repayments, and dispute resolution.

### Key Benefits of Blockchain Integration

1. **Transparency**: All loan terms and transactions are recorded on the blockchain, providing immutable records.
2. **Automation**: Smart contracts automatically execute loan disbursements and repayments based on predefined conditions.
3. **Security**: Cryptographic security ensures that funds are transferred only according to agreed terms.
4. **Reduced Intermediaries**: Direct peer-to-peer transactions eliminate the need for traditional financial intermediaries.
5. **Global Accessibility**: Blockchain enables cross-border lending without traditional banking limitations.

## Smart Contract Architecture

The LendSmart platform uses a modular smart contract architecture:

### Contract Structure

```
contracts/
├── LoanManager.sol         # Central contract for loan management
├── BorrowerContract.sol    # Individual borrower contract
├── LenderRegistry.sol      # Registry of lenders and their investments
├── ReputationSystem.sol    # Borrower and lender reputation tracking
├── TokenizedLoan.sol       # ERC-20 compliant loan tokenization
├── Oracle.sol              # External data integration
├── interfaces/             # Contract interfaces
│   ├── ILoanManager.sol
│   ├── IBorrowerContract.sol
│   └── ...
├── libraries/              # Reusable contract libraries
│   ├── SafeMath.sol
│   ├── LoanCalculations.sol
│   └── ...
└── utils/                  # Utility contracts
    ├── Ownable.sol
    ├── Pausable.sol
    └── ...
```

### Core Contracts

#### LoanManager.sol

The central contract that coordinates the lending platform:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./interfaces/ILoanManager.sol";
import "./libraries/SafeMath.sol";
import "./utils/Ownable.sol";
import "./utils/Pausable.sol";

contract LoanManager is ILoanManager, Ownable, Pausable {
    using SafeMath for uint256;

    // State variables
    uint256 public loanCount;
    mapping(uint256 => Loan) public loans;
    mapping(address => uint256[]) public borrowerLoans;
    mapping(address => uint256[]) public lenderInvestments;

    // Events
    event LoanCreated(uint256 indexed loanId, address indexed borrower, uint256 amount, uint256 term, uint256 interestRate);
    event LoanFunded(uint256 indexed loanId, address indexed lender, uint256 amount);
    event LoanDisbursed(uint256 indexed loanId, address indexed borrower, uint256 amount);
    event RepaymentMade(uint256 indexed loanId, address indexed borrower, uint256 amount, uint256 remainingBalance);
    event LoanCompleted(uint256 indexed loanId);
    event LoanDefaulted(uint256 indexed loanId);

    // Structs
    struct Loan {
        uint256 id;
        address borrower;
        uint256 amount;
        uint256 term;
        uint256 interestRate;
        uint256 startDate;
        uint256 endDate;
        LoanStatus status;
        uint256 currentBalance;
        uint256 nextRepaymentDate;
        mapping(address => uint256) lenderContributions;
        address[] lenders;
    }

    enum LoanStatus { Pending, Active, Completed, Defaulted }

    // Functions
    function createLoan(uint256 _amount, uint256 _term, uint256 _interestRate) external whenNotPaused returns (uint256) {
        // Implementation details
    }

    function fundLoan(uint256 _loanId) external payable whenNotPaused {
        // Implementation details
    }

    function disburseLoan(uint256 _loanId) external whenNotPaused {
        // Implementation details
    }

    function makeRepayment(uint256 _loanId) external payable whenNotPaused {
        // Implementation details
    }

    function markLoanAsDefaulted(uint256 _loanId) external onlyOwner {
        // Implementation details
    }

    // Additional functions
}
```

#### BorrowerContract.sol

Individual contract created for each borrower:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./interfaces/IBorrowerContract.sol";
import "./libraries/SafeMath.sol";

contract BorrowerContract is IBorrowerContract {
    using SafeMath for uint256;

    // State variables
    address public borrower;
    address public loanManager;
    uint256 public reputationScore;
    uint256[] public activeLoans;
    uint256 public totalBorrowed;
    uint256 public totalRepaid;

    // Events
    event ReputationUpdated(address indexed borrower, uint256 newScore);

    // Constructor
    constructor(address _borrower, address _loanManager) {
        borrower = _borrower;
        loanManager = _loanManager;
        reputationScore = 50; // Default starting score
    }

    // Functions
    function updateReputation(uint256 _newScore) external {
        // Implementation details
    }

    function addLoan(uint256 _loanId) external {
        // Implementation details
    }

    function removeLoan(uint256 _loanId) external {
        // Implementation details
    }

    function recordRepayment(uint256 _amount) external {
        // Implementation details
    }

    // Additional functions
}
```

### Contract Interactions

The smart contracts interact in the following ways:

1. **Loan Creation**:
   - Borrower requests loan through `LoanManager.createLoan()`
   - `LoanManager` creates a loan entry and links it to the borrower's `BorrowerContract`

2. **Loan Funding**:
   - Lenders fund loans through `LoanManager.fundLoan()`
   - `LoanManager` records lender contributions and updates loan funding status

3. **Loan Disbursement**:
   - Once fully funded, funds are disbursed to borrower through `LoanManager.disburseLoan()`
   - `BorrowerContract` records the loan and updates borrower's total borrowed amount

4. **Repayments**:
   - Borrower makes repayments through `LoanManager.makeRepayment()`
   - `LoanManager` distributes repayments to lenders based on their contribution percentages
   - `BorrowerContract` records the repayment and updates reputation score

5. **Loan Completion/Default**:
   - `LoanManager` tracks repayment status and marks loans as completed or defaulted
   - `BorrowerContract` updates reputation score based on loan outcome

## Contract Deployment

### Deployment Process

1. **Compile Contracts**:
   ```bash
   truffle compile
   ```

2. **Configure Deployment Networks**:
   Edit `truffle-config.js` to specify deployment networks:
   ```javascript
   module.exports = {
     networks: {
       development: {
         host: "127.0.0.1",
         port: 8545,
         network_id: "*"
       },
       ropsten: {
         provider: () => new HDWalletProvider(
           process.env.MNEMONIC,
           `https://ropsten.infura.io/v3/${process.env.INFURA_PROJECT_ID}`
         ),
         network_id: 3,
         gas: 5500000,
         confirmations: 2,
         timeoutBlocks: 200,
         skipDryRun: true
       },
       polygon: {
         provider: () => new HDWalletProvider(
           process.env.MNEMONIC,
           `https://polygon-mainnet.infura.io/v3/${process.env.INFURA_PROJECT_ID}`
         ),
         network_id: 137,
         gas: 5500000,
         gasPrice: 30000000000,
         confirmations: 2,
         timeoutBlocks: 200,
         skipDryRun: true
       }
     },
     compilers: {
       solc: {
         version: "0.8.10",
         settings: {
           optimizer: {
             enabled: true,
             runs: 200
           }
         }
       }
     }
   };
   ```

3. **Create Migration Scripts**:
   ```javascript
   // migrations/2_deploy_contracts.js
   const LoanManager = artifacts.require("LoanManager");
   const ReputationSystem = artifacts.require("ReputationSystem");
   const LenderRegistry = artifacts.require("LenderRegistry");

   module.exports = async function(deployer, network, accounts) {
     // Deploy ReputationSystem
     await deployer.deploy(ReputationSystem);
     const reputationSystem = await ReputationSystem.deployed();

     // Deploy LenderRegistry
     await deployer.deploy(LenderRegistry);
     const lenderRegistry = await LenderRegistry.deployed();

     // Deploy LoanManager with dependencies
     await deployer.deploy(
       LoanManager,
       reputationSystem.address,
       lenderRegistry.address
     );
     const loanManager = await LoanManager.deployed();

     // Set up permissions
     await reputationSystem.setLoanManager(loanManager.address);
     await lenderRegistry.setLoanManager(loanManager.address);
   };
   ```

4. **Deploy Contracts**:
   ```bash
   # For development
   truffle migrate --network development

   # For testnet
   truffle migrate --network ropsten

   # For mainnet
   truffle migrate --network polygon
   ```

5. **Verify Contracts** on Etherscan/Polygonscan:
   ```bash
   truffle run verify LoanManager ReputationSystem LenderRegistry --network polygon
   ```

### Deployment Considerations

- **Gas Costs**: Optimize contracts to reduce deployment gas costs
- **Network Selection**: Choose appropriate network based on gas costs, transaction speed, and user base
- **Contract Verification**: Always verify contracts on block explorers for transparency
- **Deployment Order**: Deploy contracts in the correct order to handle dependencies
- **Initial Configuration**: Set up initial parameters and permissions after deployment

## Contract Interaction

### Web3.js Integration

Example of interacting with contracts using Web3.js:

```javascript
const Web3 = require('web3');
const LoanManagerABI = require('./abis/LoanManager.json');

// Connect to blockchain
const web3 = new Web3('https://polygon-mainnet.infura.io/v3/YOUR_INFURA_KEY');

// Set up account
const account = web3.eth.accounts.privateKeyToAccount('0x' + PRIVATE_KEY);
web3.eth.accounts.wallet.add(account);

// Contract instance
const loanManagerAddress = '0x1234567890123456789012345678901234567890';
const loanManager = new web3.eth.Contract(LoanManagerABI.abi, loanManagerAddress);

// Create loan
async function createLoan(amount, term, interestRate) {
  const amountWei = web3.utils.toWei(amount.toString(), 'ether');

  try {
    const tx = await loanManager.methods
      .createLoan(amountWei, term, interestRate)
      .send({
        from: account.address,
        gas: 500000,
        gasPrice: web3.utils.toWei('50', 'gwei')
      });

    console.log('Loan created:', tx.events.LoanCreated.returnValues);
    return tx.events.LoanCreated.returnValues.loanId;
  } catch (error) {
    console.error('Error creating loan:', error);
    throw error;
  }
}

// Fund loan
async function fundLoan(loanId, amount) {
  const amountWei = web3.utils.toWei(amount.toString(), 'ether');

  try {
    const tx = await loanManager.methods
      .fundLoan(loanId)
      .send({
        from: account.address,
        value: amountWei,
        gas: 500000,
        gasPrice: web3.utils.toWei('50', 'gwei')
      });

    console.log('Loan funded:', tx.events.LoanFunded.returnValues);
    return tx;
  } catch (error) {
    console.error('Error funding loan:', error);
    throw error;
  }
}
```

### ethers.js Integration

Example of interacting with contracts using ethers.js:

```javascript
const { ethers } = require('ethers');
const LoanManagerABI = require('./abis/LoanManager.json');

// Connect to blockchain
const provider = new ethers.providers.JsonRpcProvider(
  'https://polygon-mainnet.infura.io/v3/YOUR_INFURA_KEY'
);

// Set up signer
const wallet = new ethers.Wallet('0x' + PRIVATE_KEY, provider);

// Contract instance
const loanManagerAddress = '0x1234567890123456789012345678901234567890';
const loanManager = new ethers.Contract(loanManagerAddress, LoanManagerABI.abi, wallet);

// Create loan
async function createLoan(amount, term, interestRate) {
  const amountWei = ethers.utils.parseEther(amount.toString());

  try {
    const tx = await loanManager.createLoan(amountWei, term, interestRate);
    const receipt = await tx.wait();

    const loanCreatedEvent = receipt.events.find(event => event.event === 'LoanCreated');
    console.log('Loan created:', loanCreatedEvent.args);
    return loanCreatedEvent.args.loanId;
  } catch (error) {
    console.error('Error creating loan:', error);
    throw error;
  }
}

// Fund loan
async function fundLoan(loanId, amount) {
  const amountWei = ethers.utils.parseEther(amount.toString());

  try {
    const tx = await loanManager.fundLoan(loanId, { value: amountWei });
    const receipt = await tx.wait();

    const loanFundedEvent = receipt.events.find(event => event.event === 'LoanFunded');
    console.log('Loan funded:', loanFundedEvent.args);
    return receipt;
  } catch (error) {
    console.error('Error funding loan:', error);
    throw error;
  }
}
```

### Event Listening

Example of listening to contract events:

```javascript
// Using Web3.js
function listenToEvents() {
  // Listen for loan creation events
  loanManager.events.LoanCreated({
    fromBlock: 'latest'
  })
  .on('data', event => {
    console.log('New loan created:', {
      loanId: event.returnValues.loanId,
      borrower: event.returnValues.borrower,
      amount: web3.utils.fromWei(event.returnValues.amount, 'ether'),
      term: event.returnValues.term,
      interestRate: event.returnValues.interestRate
    });
  })
  .on('error', error => {
    console.error('Error in event listener:', error);
  });

  // Listen for repayment events
  loanManager.events.RepaymentMade({
    fromBlock: 'latest'
  })
  .on('data', event => {
    console.log('Repayment made:', {
      loanId: event.returnValues.loanId,
      borrower: event.returnValues.borrower,
      amount: web3.utils.fromWei(event.returnValues.amount, 'ether'),
      remainingBalance: web3.utils.fromWei(event.returnValues.remainingBalance, 'ether')
    });
  })
  .on('error', error => {
    console.error('Error in event listener:', error);
  });
}
```

## Security Considerations

### Common Vulnerabilities

1. **Reentrancy Attacks**:
   - Use the Checks-Effects-Interactions pattern
   - Implement reentrancy guards
   ```solidity
   // Reentrancy guard implementation
   bool private _notEntered;

   modifier nonReentrant() {
       require(_notEntered, "ReentrancyGuard: reentrant call");
       _notEntered = false;
       _;
       _notEntered = true;
   }
   ```

2. **Integer Overflow/Underflow**:
   - Use SafeMath library for arithmetic operations
   ```solidity
   using SafeMath for uint256;

   function makeRepayment(uint256 _loanId) external payable nonReentrant {
       Loan storage loan = loans[_loanId];
       loan.currentBalance = loan.currentBalance.sub(msg.value);
   }
   ```

3. **Access Control Issues**:
   - Implement proper access control modifiers
   ```solidity
   modifier onlyBorrower(uint256 _loanId) {
       require(loans[_loanId].borrower == msg.sender, "Not the borrower");
       _;
   }

   function withdrawCollateral(uint256 _loanId) external onlyBorrower(_loanId) {
       // Implementation
   }
   ```

4. **Front-Running**:
   - Implement commit-reveal schemes for sensitive operations
   - Use transaction privacy solutions when necessary

5. **Oracle Manipulation**:
   - Use decentralized oracles
   - Implement time-weighted average prices
   - Use multiple data sources

### Security Best Practices

1. **Code Audits**:
   - Conduct thorough code audits by reputable security firms
   - Implement all recommended changes from audits

2. **Formal Verification**:
   - Use formal verification tools to mathematically prove contract correctness
   - Focus verification on critical functions like fund transfers

3. **Comprehensive Testing**:
   - Implement unit tests for all functions
   - Conduct integration tests for contract interactions
   - Perform scenario-based testing for complex workflows

4. **Emergency Mechanisms**:
   - Implement circuit breakers (pause functionality)
   ```solidity
   bool public paused;

   modifier whenNotPaused() {
       require(!paused, "Contract is paused");
       _;
   }

   function pause() external onlyOwner {
       paused = true;
   }

   function unpause() external onlyOwner {
       paused = false;
   }
   ```

5. **Rate Limiting**:
   - Implement rate limiting for sensitive operations
   ```solidity
   mapping(address => uint256) public lastOperationTime;
   uint256 public constant OPERATION_DELAY = 1 days;

   modifier rateLimited() {
       require(block.timestamp >= lastOperationTime[msg.sender].add(OPERATION_DELAY), "Rate limited");
       lastOperationTime[msg.sender] = block.timestamp;
       _;
   }
   ```

## Gas Optimization

### Optimization Techniques

1. **Storage Optimization**:
   - Use `bytes32` instead of `string` where possible
   - Pack multiple variables into a single storage slot
   - Use `mapping` instead of arrays for lookups

2. **Computation Optimization**:
   - Move complex calculations off-chain when possible
   - Cache frequently accessed storage variables in memory
   ```solidity
   function processLoan(uint256 _loanId) external {
       Loan storage loan = loans[_loanId];
       uint256 amount = loan.amount; // Cache in memory
       uint256 term = loan.term; // Cache in memory

       // Use cached variables in calculations
   }
   ```

3. **Loop Optimization**:
   - Avoid unbounded loops
   - Use pagination for large data sets
   - Consider gas limits when processing multiple items

4. **Event Optimization**:
   - Use indexed parameters for efficient filtering
   - Only emit necessary events
   - Store minimal data in events

### Gas Cost Analysis

Estimated gas costs for common operations:

| Operation | Approximate Gas Cost |
|-----------|---------------------|
| Contract Deployment | 1,500,000 - 3,000,000 |
| Loan Creation | 150,000 - 250,000 |
| Loan Funding | 80,000 - 120,000 |
| Loan Disbursement | 100,000 - 150,000 |
| Repayment Processing | 80,000 - 120,000 |
| Loan Completion | 60,000 - 100,000 |

## Testing and Verification

### Testing Framework

LendSmart uses Truffle for contract testing:

```javascript
// test/loan_manager_test.js
const LoanManager = artifacts.require("LoanManager");
const ReputationSystem = artifacts.require("ReputationSystem");
const LenderRegistry = artifacts.require("LenderRegistry");

contract("LoanManager", accounts => {
  const [owner, borrower, lender1, lender2] = accounts;
  let loanManager, reputationSystem, lenderRegistry;

  beforeEach(async () => {
    reputationSystem = await ReputationSystem.new();
    lenderRegistry = await LenderRegistry.new();
    loanManager = await LoanManager.new(
      reputationSystem.address,
      lenderRegistry.address
    );

    await reputationSystem.setLoanManager(loanManager.address);
    await lenderRegistry.setLoanManager(loanManager.address);
  });

  describe("Loan Creation", () => {
    it("should create a new loan", async () => {
      const amount = web3.utils.toWei("1", "ether");
      const term = 12; // 12 months
      const interestRate = 500; // 5.00%

      const tx = await loanManager.createLoan(amount, term, interestRate, { from: borrower });
      const loanId = tx.logs[0].args.loanId.toNumber();

      const loan = await loanManager.loans(loanId);
      assert.equal(loan.borrower, borrower);
      assert.equal(loan.amount, amount);
      assert.equal(loan.term, term);
      assert.equal(loan.interestRate, interestRate);
      assert.equal(loan.status, 0); // Pending status
    });

    it("should reject loan with invalid parameters", async () => {
      const amount = web3.utils.toWei("0", "ether");
      const term = 12;
      const interestRate = 500;

      try {
        await loanManager.createLoan(amount, term, interestRate, { from: borrower });
        assert.fail("Should have thrown an error");
      } catch (error) {
        assert(error.message.includes("Amount must be greater than 0"));
      }
    });
  });

  describe("Loan Funding", () => {
    let loanId;

    beforeEach(async () => {
      const amount = web3.utils.toWei("1", "ether");
      const term = 12;
      const interestRate = 500;

      const tx = await loanManager.createLoan(amount, term, interestRate, { from: borrower });
      loanId = tx.logs[0].args.loanId.toNumber();
    });

    it("should allow lenders to fund a loan", async () => {
      const fundAmount = web3.utils.toWei("0.5", "ether");

      await loanManager.fundLoan(loanId, { from: lender1, value: fundAmount });

      const lenderContribution = await loanManager.getLenderContribution(loanId, lender1);
      assert.equal(lenderContribution.toString(), fundAmount);
    });

    it("should disburse funds when loan is fully funded", async () => {
      const fundAmount = web3.utils.toWei("1", "ether");
      const initialBalance = await web3.eth.getBalance(borrower);

      await loanManager.fundLoan(loanId, { from: lender1, value: fundAmount });

      const loan = await loanManager.loans(loanId);
      assert.equal(loan.status, 1); // Active status

      const newBalance = await web3.eth.getBalance(borrower);
      const expectedBalance = web3.utils.toBN(initialBalance).add(web3.utils.toBN(fundAmount));

      assert.equal(newBalance.toString(), expectedBalance.toString());
    });
  });

  // Additional test cases for repayments, defaults, etc.
});
```

### Test Coverage

Ensure comprehensive test coverage:

```bash
# Run tests with coverage
truffle run coverage
```

Aim for at least 95% test coverage across all contracts, with particular focus on:
- Fund transfer functions
- Access control mechanisms
- State transitions
- Error handling

### Formal Verification

For critical contracts, consider formal verification:

1. **Specification**:
   Define formal specifications for contract behavior

2. **Verification Tools**:
   Use tools like Certora Prover or Manticore

3. **Properties to Verify**:
   - Fund safety (no unauthorized withdrawals)
   - State consistency (valid state transitions)
   - Access control correctness
   - Mathematical correctness (interest calculations)

## Upgradeability

### Upgrade Patterns

LendSmart implements the proxy pattern for contract upgradeability:

1. **Proxy Contract**:
   ```solidity
   // SPDX-License-Identifier: MIT
   pragma solidity ^0.8.0;

   contract LoanManagerProxy {
       address public implementation;
       address public admin;

       constructor(address _implementation) {
           implementation = _implementation;
           admin = msg.sender;
       }

       modifier onlyAdmin() {
           require(msg.sender == admin, "Not authorized");
           _;
       }

       function upgrade(address _newImplementation) external onlyAdmin {
           implementation = _newImplementation;
       }

       fallback() external payable {
           address _impl = implementation;

           assembly {
               let ptr := mload(0x40)
               calldatacopy(ptr, 0, calldatasize())
               let result := delegatecall(gas(), _impl, ptr, calldatasize(), 0, 0)
               let size := returndatasize()
               returndatacopy(ptr, 0, size)

               switch result
               case 0 { revert(ptr, size) }
               default { return(ptr, size) }
           }
       }

       receive() external payable {}
   }
   ```

2. **Implementation Contract**:
   ```solidity
   // SPDX-License-Identifier: MIT
   pragma solidity ^0.8.0;

   import "./LoanManagerStorage.sol";

   contract LoanManagerV1 is LoanManagerStorage {
       // Implementation logic
   }
   ```

3. **Storage Contract**:
   ```solidity
   // SPDX-License-Identifier: MIT
   pragma solidity ^0.8.0;

   contract LoanManagerStorage {
       // Storage variables that will persist across upgrades
       uint256 public loanCount;
       mapping(uint256 => Loan) public loans;
       // Other storage variables

       // Structs
       struct Loan {
           // Loan properties
       }
   }
   ```

### Upgrade Process

1. **Deploy New Implementation**:
   ```javascript
   const LoanManagerV2 = artifacts.require("LoanManagerV2");
   const newImplementation = await LoanManagerV2.new();
   ```

2. **Update Proxy**:
   ```javascript
   const LoanManagerProxy = artifacts.require("LoanManagerProxy");
   const proxy = await LoanManagerProxy.at(proxyAddress);
   await proxy.upgrade(newImplementation.address);
   ```

3. **Verify Upgrade**:
   ```javascript
   const currentImplementation = await proxy.implementation();
   assert.equal(currentImplementation, newImplementation.address);
   ```

### Upgrade Considerations

- **Storage Compatibility**: Ensure new implementations maintain storage layout
- **Function Selectors**: Maintain function signatures for compatibility
- **State Migration**: Implement migration functions if storage structure changes
- **Testing**: Thoroughly test upgrades in testnet before mainnet deployment
- **Governance**: Implement multi-signature or DAO governance for upgrade authorization

## Blockchain Integration

### Backend Integration

The LendSmart backend integrates with blockchain through:

1. **Web3 Service**:
   ```javascript
   // services/blockchainService.js
   const Web3 = require('web3');
   const LoanManagerABI = require('../contracts/LoanManager.json');

   class BlockchainService {
     constructor() {
       this.web3 = new Web3(process.env.BLOCKCHAIN_PROVIDER_URL);
       this.loanManagerAddress = process.env.LOAN_MANAGER_ADDRESS;
       this.loanManager = new this.web3.eth.Contract(
         LoanManagerABI.abi,
         this.loanManagerAddress
       );

       // Set up wallet
       this.account = this.web3.eth.accounts.privateKeyToAccount(
         '0x' + process.env.WALLET_PRIVATE_KEY
       );
       this.web3.eth.accounts.wallet.add(this.account);
     }

     async createLoan(borrowerId, amount, term, interestRate) {
       try {
         const amountWei = this.web3.utils.toWei(amount.toString(), 'ether');

         const tx = await this.loanManager.methods
           .createLoan(amountWei, term, interestRate)
           .send({
             from: this.account.address,
             gas: 500000,
             gasPrice: this.web3.utils.toWei('50', 'gwei')
           });

         return {
           loanId: tx.events.LoanCreated.returnValues.loanId,
           transactionHash: tx.transactionHash,
           blockNumber: tx.blockNumber
         };
       } catch (error) {
         console.error('Blockchain error:', error);
         throw new Error('Failed to create loan on blockchain');
       }
     }

     // Other blockchain interaction methods
   }

   module.exports = new BlockchainService();
   ```

2. **Event Listeners**:
   ```javascript
   // services/blockchainEventService.js
   const BlockchainService = require('./blockchainService');
   const LoanService = require('./loanService');
   const NotificationService = require('./notificationService');

   class BlockchainEventService {
     constructor() {
       this.web3 = BlockchainService.web3;
       this.loanManager = BlockchainService.loanManager;
     }

     startListening() {
       this.listenForLoanCreated();
       this.listenForLoanFunded();
       this.listenForRepaymentMade();
       this.listenForLoanCompleted();
       this.listenForLoanDefaulted();
     }

     listenForLoanCreated() {
       this.loanManager.events.LoanCreated({
         fromBlock: 'latest'
       })
       .on('data', async event => {
         try {
           const { loanId, borrower, amount, term, interestRate } = event.returnValues;

           // Update database
           await LoanService.updateLoanBlockchainStatus(loanId, {
             contractAddress: this.loanManager.options.address,
             transactionHash: event.transactionHash,
             blockNumber: event.blockNumber,
             status: 'pending'
           });

           // Send notification
           await NotificationService.sendNotification(borrower, {
             type: 'loan_created',
             title: 'Loan Created',
             message: `Your loan #${loanId} has been created on the blockchain.`
           });
         } catch (error) {
           console.error('Error processing LoanCreated event:', error);
         }
       })
       .on('error', error => {
         console.error('Error in LoanCreated event listener:', error);
       });
     }

     // Other event listeners
   }

   module.exports = new BlockchainEventService();
   ```

### Frontend Integration

The frontend integrates with blockchain through:

1. **Wallet Connection**:
   ```javascript
   // hooks/useWallet.js
   import { useState, useEffect } from 'react';
   import Web3 from 'web3';

   export function useWallet() {
     const [account, setAccount] = useState(null);
     const [web3, setWeb3] = useState(null);
     const [connected, setConnected] = useState(false);
     const [chainId, setChainId] = useState(null);
     const [error, setError] = useState(null);

     const connectWallet = async () => {
       if (window.ethereum) {
         try {
           // Request account access
           const accounts = await window.ethereum.request({
             method: 'eth_requestAccounts'
           });

           const web3Instance = new Web3(window.ethereum);
           const chainIdHex = await web3Instance.eth.getChainId();

           setAccount(accounts[0]);
           setWeb3(web3Instance);
           setChainId(chainIdHex);
           setConnected(true);
           setError(null);

           return { account: accounts[0], web3: web3Instance };
         } catch (error) {
           setError('User denied account access');
           throw error;
         }
       } else {
         setError('No Ethereum browser extension detected');
         throw new Error('No Ethereum browser extension detected');
       }
     };

     const disconnectWallet = () => {
       setAccount(null);
       setWeb3(null);
       setConnected(false);
       setChainId(null);
     };

     // Listen for account changes
     useEffect(() => {
       if (window.ethereum) {
         window.ethereum.on('accountsChanged', accounts => {
           if (accounts.length > 0) {
             setAccount(accounts[0]);
           } else {
             disconnectWallet();
           }
         });

         window.ethereum.on('chainChanged', chainId => {
           setChainId(chainId);
           window.location.reload();
         });
       }

       return () => {
         if (window.ethereum) {
           window.ethereum.removeAllListeners();
         }
       };
     }, []);

     return {
       account,
       web3,
       connected,
       chainId,
       error,
       connectWallet,
       disconnectWallet
     };
   }
   ```

2. **Contract Interaction**:
   ```javascript
   // hooks/useLoanContract.js
   import { useState, useEffect } from 'react';
   import LoanManagerABI from '../contracts/LoanManager.json';

   export function useLoanContract(web3, account) {
     const [contract, setContract] = useState(null);
     const [loading, setLoading] = useState(true);
     const [error, setError] = useState(null);

     useEffect(() => {
       if (web3 && account) {
         try {
           const loanManagerAddress = process.env.REACT_APP_LOAN_MANAGER_ADDRESS;
           const contractInstance = new web3.eth.Contract(
             LoanManagerABI.abi,
             loanManagerAddress
           );

           setContract(contractInstance);
           setLoading(false);
           setError(null);
         } catch (err) {
           setError('Failed to load contract');
           setLoading(false);
         }
       }
     }, [web3, account]);

     const createLoan = async (amount, term, interestRate) => {
       if (!contract || !account) {
         throw new Error('Contract or account not available');
       }

       try {
         const amountWei = web3.utils.toWei(amount.toString(), 'ether');

         const tx = await contract.methods
           .createLoan(amountWei, term, interestRate)
           .send({ from: account });

         return {
           loanId: tx.events.LoanCreated.returnValues.loanId,
           transactionHash: tx.transactionHash
         };
       } catch (error) {
         console.error('Error creating loan:', error);
         throw error;
       }
     };

     const fundLoan = async (loanId, amount) => {
       if (!contract || !account) {
         throw new Error('Contract or account not available');
       }

       try {
         const amountWei = web3.utils.toWei(amount.toString(), 'ether');

         const tx = await contract.methods
           .fundLoan(loanId)
           .send({
             from: account,
             value: amountWei
           });

         return {
           transactionHash: tx.transactionHash
         };
       } catch (error) {
         console.error('Error funding loan:', error);
         throw error;
       }
     };

     // Other contract interaction methods

     return {
       contract,
       loading,
       error,
       createLoan,
       fundLoan
       // Other methods
     };
   }
   ```

3. **Transaction Monitoring**:
   ```javascript
   // hooks/useTransactionMonitor.js
   import { useState, useEffect } from 'react';

   export function useTransactionMonitor(web3, txHash) {
     const [status, setStatus] = useState('pending');
     const [receipt, setReceipt] = useState(null);
     const [confirmations, setConfirmations] = useState(0);
     const [error, setError] = useState(null);

     useEffect(() => {
       if (!web3 || !txHash) return;

       let mounted = true;
       let interval;

       const checkTransaction = async () => {
         try {
           const receipt = await web3.eth.getTransactionReceipt(txHash);

           if (receipt) {
             if (mounted) {
               setReceipt(receipt);

               if (receipt.status) {
                 setStatus('confirmed');
               } else {
                 setStatus('failed');
                 setError('Transaction failed');
               }
             }

             // Get confirmations
             const currentBlock = await web3.eth.getBlockNumber();
             const confirmationCount = currentBlock - receipt.blockNumber;

             if (mounted) {
               setConfirmations(confirmationCount);
             }

             // Clear interval after sufficient confirmations
             if (confirmationCount >= 12) {
               clearInterval(interval);
             }
           }
         } catch (err) {
           if (mounted) {
             setError(err.message);
           }
         }
       };

       // Initial check
       checkTransaction();

       // Set up polling
       interval = setInterval(checkTransaction, 5000);

       return () => {
         mounted = false;
         clearInterval(interval);
       };
     }, [web3, txHash]);

     return { status, receipt, confirmations, error };
   }
   ```

### Cross-Chain Compatibility

LendSmart supports multiple blockchain networks:

1. **Network Configuration**:
   ```javascript
   // config/blockchainConfig.js
   const networks = {
     1: {
       name: 'Ethereum Mainnet',
       rpcUrl: 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY',
       explorerUrl: 'https://etherscan.io',
       contracts: {
         loanManager: '0x1234567890123456789012345678901234567890',
         reputationSystem: '0x1234567890123456789012345678901234567891'
       },
       nativeCurrency: {
         name: 'Ether',
         symbol: 'ETH',
         decimals: 18
       }
     },
     137: {
       name: 'Polygon Mainnet',
       rpcUrl: 'https://polygon-rpc.com',
       explorerUrl: 'https://polygonscan.com',
       contracts: {
         loanManager: '0x2345678901234567890123456789012345678901',
         reputationSystem: '0x2345678901234567890123456789012345678902'
       },
       nativeCurrency: {
         name: 'MATIC',
         symbol: 'MATIC',
         decimals: 18
       }
     },
     // Other networks
   };

   function getNetworkConfig(chainId) {
     return networks[chainId] || networks[137]; // Default to Polygon
   }

   module.exports = {
     networks,
     getNetworkConfig
   };
   ```

2. **Network Switching**:
   ```javascript
   // utils/networkUtils.js
   import { networks } from '../config/blockchainConfig';

   export async function switchNetwork(ethereum, targetChainId) {
     if (!ethereum) throw new Error('No Ethereum provider');

     const targetNetwork = networks[targetChainId];
     if (!targetNetwork) throw new Error('Unsupported network');

     try {
       await ethereum.request({
         method: 'wallet_switchEthereumChain',
         params: [{ chainId: `0x${targetChainId.toString(16)}` }]
       });
       return true;
     } catch (error) {
       // Chain doesn't exist in wallet
       if (error.code === 4902) {
         try {
           await ethereum.request({
             method: 'wallet_addEthereumChain',
             params: [{
               chainId: `0x${targetChainId.toString(16)}`,
               chainName: targetNetwork.name,
               nativeCurrency: targetNetwork.nativeCurrency,
               rpcUrls: [targetNetwork.rpcUrl],
               blockExplorerUrls: [targetNetwork.explorerUrl]
             }]
           });
           return true;
         } catch (addError) {
           throw new Error(`Failed to add network: ${addError.message}`);
         }
       }
       throw error;
     }
   }
   ```

3. **Cross-Chain Bridges**:
   - Integration with cross-chain bridges for asset transfers
   - Support for wrapped tokens across chains
   - Unified user experience across multiple networks
