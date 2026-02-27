# Smart Contract Interaction Example

**Interacting with LendSmart Smart Contracts**

This example demonstrates how to interact with LendSmart smart contracts using ethers.js.

---

## Prerequisites

- Node.js 18+
- ethers.js v6
- Deployed LendSmartLoan contract
- MetaMask or private key for signing
- Test ETH/tokens

---

## Setup

```bash
npm install ethers dotenv
```

Create `.env`:

```env
PRIVATE_KEY=your_private_key_here
RPC_URL=https://goerli.infura.io/v3/YOUR_PROJECT_ID
LOAN_CONTRACT_ADDRESS=0x...
TOKEN_ADDRESS=0x...
```

---

## Complete Example

```javascript
const { ethers } = require("ethers");
require("dotenv").config();

// Contract ABI (simplified - use full ABI in production)
const LOAN_CONTRACT_ABI = [
  "function requestLoan(address token, uint256 principal, uint256 interestRate, uint256 duration, string purpose, bool isCollateralized) external returns (uint256)",
  "function getLoan(uint256 loanId) external view returns (tuple(uint256 id, address borrower, address lender, address token, uint256 principal, uint256 interestRate, uint256 duration, uint256 requestedTime, uint256 fundedTime, uint256 disbursedTime, uint256 repaymentAmount, uint256 amountRepaid, uint256 riskScore, uint8 status, string purpose, bool isCollateralized, uint256 collateralAmount, address collateralToken))",
  "function fundLoan(uint256 loanId) external",
  "function disburseLoan(uint256 loanId) external",
  "function makeRepayment(uint256 loanId, uint256 amount) external",
  "function assignRiskScore(uint256 loanId, uint256 score) external",
  "event LoanRequested(uint256 indexed loanId, address indexed borrower, address indexed token, uint256 principal, uint256 interestRate, uint256 duration, string purpose, bool isCollateralized)",
  "event LoanFunded(uint256 indexed loanId, address indexed lender, uint256 fundedTime)",
  "event LoanDisbursed(uint256 indexed loanId, address indexed borrower, uint256 amount, uint256 disbursedTime)",
  "event LoanRepaid(uint256 indexed loanId, address indexed borrower, uint256 amountPaid, uint256 totalRepaid, uint256 remainingBalance)",
];

const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function balanceOf(address account) external view returns (uint256)",
  "function transfer(address to, uint256 amount) external returns (bool)",
];

class LendSmartContractClient {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    this.wallet = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
    this.loanContract = new ethers.Contract(
      process.env.LOAN_CONTRACT_ADDRESS,
      LOAN_CONTRACT_ABI,
      this.wallet,
    );
    this.tokenContract = new ethers.Contract(
      process.env.TOKEN_ADDRESS,
      ERC20_ABI,
      this.wallet,
    );
  }

  // Request a new loan
  async requestLoan(
    principal,
    interestRate,
    durationDays,
    purpose,
    isCollateralized = false,
  ) {
    console.log("Requesting loan...");

    const principalWei = ethers.parseEther(principal.toString());
    const durationSeconds = durationDays * 24 * 60 * 60;

    const tx = await this.loanContract.requestLoan(
      process.env.TOKEN_ADDRESS,
      principalWei,
      interestRate, // e.g., 850 for 8.50%
      durationSeconds,
      purpose,
      isCollateralized,
    );

    console.log("Transaction sent:", tx.hash);
    const receipt = await tx.wait();
    console.log("Transaction confirmed");

    // Extract loan ID from event
    const event = receipt.logs
      .map((log) => {
        try {
          return this.loanContract.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find((parsed) => parsed && parsed.name === "LoanRequested");

    if (event) {
      const loanId = event.args.loanId.toString();
      console.log("Loan ID:", loanId);
      return loanId;
    }

    throw new Error("Loan ID not found in events");
  }

  // Get loan details
  async getLoan(loanId) {
    console.log(`Getting loan ${loanId}...`);
    const loan = await this.loanContract.getLoan(loanId);

    const loanData = {
      id: loan.id.toString(),
      borrower: loan.borrower,
      lender: loan.lender,
      token: loan.token,
      principal: ethers.formatEther(loan.principal),
      interestRate: (loan.interestRate / 100).toFixed(2) + "%",
      duration: (loan.duration / (24 * 60 * 60)).toString() + " days",
      status: [
        "Requested",
        "Funded",
        "Active",
        "Repaid",
        "Defaulted",
        "Cancelled",
        "Rejected",
      ][loan.status],
      purpose: loan.purpose,
      isCollateralized: loan.isCollateralized,
      repaymentAmount: ethers.formatEther(loan.repaymentAmount),
      amountRepaid: ethers.formatEther(loan.amountRepaid),
      riskScore: loan.riskScore.toString(),
    };

    console.log("Loan Data:", loanData);
    return loanData;
  }

  // Fund a loan (as lender)
  async fundLoan(loanId, amount) {
    console.log(`Funding loan ${loanId}...`);

    // First approve token spending
    const amountWei = ethers.parseEther(amount.toString());
    console.log("Approving tokens...");
    const approveTx = await this.tokenContract.approve(
      process.env.LOAN_CONTRACT_ADDRESS,
      amountWei,
    );
    await approveTx.wait();
    console.log("Tokens approved");

    // Fund the loan
    const tx = await this.loanContract.fundLoan(loanId);
    console.log("Transaction sent:", tx.hash);
    const receipt = await tx.wait();
    console.log("Loan funded successfully");

    return receipt;
  }

  // Make repayment (as borrower)
  async makeRepayment(loanId, amount) {
    console.log(`Making repayment for loan ${loanId}...`);

    const amountWei = ethers.parseEther(amount.toString());

    // Approve tokens
    console.log("Approving repayment tokens...");
    const approveTx = await this.tokenContract.approve(
      process.env.LOAN_CONTRACT_ADDRESS,
      amountWei,
    );
    await approveTx.wait();

    // Make repayment
    const tx = await this.loanContract.makeRepayment(loanId, amountWei);
    console.log("Transaction sent:", tx.hash);
    const receipt = await tx.wait();
    console.log("Repayment successful");

    return receipt;
  }

  // Listen to loan events
  async listenToLoanEvents() {
    console.log("Listening for loan events...");

    this.loanContract.on(
      "LoanRequested",
      (
        loanId,
        borrower,
        token,
        principal,
        interestRate,
        duration,
        purpose,
        isCollateralized,
        event,
      ) => {
        console.log("\n=== Loan Requested ===");
        console.log("Loan ID:", loanId.toString());
        console.log("Borrower:", borrower);
        console.log("Principal:", ethers.formatEther(principal));
        console.log("Interest Rate:", (interestRate / 100).toFixed(2) + "%");
        console.log("Purpose:", purpose);
      },
    );

    this.loanContract.on("LoanFunded", (loanId, lender, fundedTime, event) => {
      console.log("\n=== Loan Funded ===");
      console.log("Loan ID:", loanId.toString());
      console.log("Lender:", lender);
      console.log(
        "Funded Time:",
        new Date(fundedTime.toNumber() * 1000).toISOString(),
      );
    });

    this.loanContract.on(
      "LoanRepaid",
      (loanId, borrower, amountPaid, totalRepaid, remainingBalance, event) => {
        console.log("\n=== Loan Repayment ===");
        console.log("Loan ID:", loanId.toString());
        console.log("Amount Paid:", ethers.formatEther(amountPaid));
        console.log("Total Repaid:", ethers.formatEther(totalRepaid));
        console.log("Remaining:", ethers.formatEther(remainingBalance));
      },
    );
  }

  // Check wallet balance
  async checkBalance() {
    const ethBalance = await this.provider.getBalance(this.wallet.address);
    const tokenBalance = await this.tokenContract.balanceOf(
      this.wallet.address,
    );

    console.log("Wallet:", this.wallet.address);
    console.log("ETH Balance:", ethers.formatEther(ethBalance));
    console.log("Token Balance:", ethers.formatEther(tokenBalance));
  }
}

// Usage Examples
async function main() {
  const client = new LendSmartContractClient();

  try {
    // Check balance
    await client.checkBalance();

    // Example 1: Request a loan
    console.log("\n=== Requesting Loan ===");
    const loanId = await client.requestLoan(
      10, // 10 tokens
      850, // 8.50% interest rate
      365, // 365 days
      "Business expansion",
      false, // Not collateralized
    );

    // Example 2: Get loan details
    console.log("\n=== Getting Loan Details ===");
    await client.getLoan(loanId);

    // Example 3: Fund loan (as lender - use different wallet)
    // const lenderClient = new LendSmartContractClient();
    // await lenderClient.fundLoan(loanId, 10);

    // Example 4: Make repayment
    // await client.makeRepayment(loanId, 0.5);  // Partial repayment

    // Example 5: Listen to events
    console.log("\n=== Starting Event Listener ===");
    await client.listenToLoanEvents();

    // Keep script running to listen for events
    // await new Promise(() => {});  // Never resolves
  } catch (error) {
    console.error("Error:", error);
  }
}

// Run
if (require.main === module) {
  main();
}

module.exports = LendSmartContractClient;
```

---

## TypeScript Version

```typescript
import { ethers, Contract, Wallet, JsonRpcProvider } from "ethers";
import * as dotenv from "dotenv";

dotenv.config();

interface LoanData {
  id: string;
  borrower: string;
  lender: string;
  principal: string;
  interestRate: string;
  status: string;
  purpose: string;
}

class LendSmartContractClient {
  private provider: JsonRpcProvider;
  private wallet: Wallet;
  private loanContract: Contract;
  private tokenContract: Contract;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(process.env.RPC_URL!);
    this.wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, this.provider);
    this.loanContract = new ethers.Contract(
      process.env.LOAN_CONTRACT_ADDRESS!,
      LOAN_CONTRACT_ABI,
      this.wallet,
    );
    this.tokenContract = new ethers.Contract(
      process.env.TOKEN_ADDRESS!,
      ERC20_ABI,
      this.wallet,
    );
  }

  async requestLoan(
    principal: number,
    interestRate: number,
    durationDays: number,
    purpose: string,
    isCollateralized: boolean = false,
  ): Promise<string> {
    // Implementation same as JavaScript version
  }

  async getLoan(loanId: string): Promise<LoanData> {
    // Implementation same as JavaScript version
  }

  // ... other methods
}

export default LendSmartContractClient;
```

---

## Testing

```javascript
const { expect } = require("chai");
const LendSmartContractClient = require("./LendSmartContractClient");

describe("LendSmart Contract Integration", () => {
  let client;
  let loanId;

  before(async () => {
    client = new LendSmartContractClient();
  });

  it("should request a loan", async () => {
    loanId = await client.requestLoan(10, 850, 365, "Test loan", false);
    expect(loanId).to.not.be.undefined;
  });

  it("should get loan details", async () => {
    const loan = await client.getLoan(loanId);
    expect(loan.principal).to.equal("10.0");
    expect(loan.status).to.equal("Requested");
  });

  // More tests...
});
```

---

## Web3 React Integration

```typescript
import { ethers } from "ethers";
import { useState, useEffect } from "react";

export function useLendSmartContract() {
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [account, setAccount] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();

        const loanContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          LOAN_CONTRACT_ABI,
          signer,
        );

        setContract(loanContract);
        setAccount(address);
      }
    }
    init();
  }, []);

  const requestLoan = async (principal: number, interestRate: number) => {
    if (!contract) return;

    const tx = await contract.requestLoan(
      TOKEN_ADDRESS,
      ethers.parseEther(principal.toString()),
      interestRate,
      365 * 24 * 60 * 60,
      "Business loan",
      false,
    );

    const receipt = await tx.wait();
    return receipt;
  };

  return { contract, account, requestLoan };
}
```

---

## Next Steps

- See [Loan Application Example](LOAN_APPLICATION_EXAMPLE.md) for API integration
- See [AI Credit Scoring Example](AI_CREDIT_SCORING_EXAMPLE.md) for ML integration
- Check [API Documentation](../API.md) for backend endpoints
