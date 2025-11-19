const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LendSmartLoan", function () {
  let lendSmartLoan;
  let owner, feeRecipient, riskAssessor, borrower, lender, otherAccount;
  let mockToken, mockCollateralToken;

  const SECONDS_IN_DAY = 86400;
  const LOAN_AMOUNT = ethers.parseUnits("1000", 18);
  const COLLATERAL_AMOUNT = ethers.parseUnits("1500", 18);
  const INTEREST_RATE = 500; // 5.00%
  const LOAN_DURATION = 30 * SECONDS_IN_DAY; // 30 days
  const PLATFORM_FEE = 100; // 1.00%

  beforeEach(async function () {
    // Get signers
    [owner, feeRecipient, riskAssessor, borrower, lender, otherAccount] = await ethers.getSigners();

    // Deploy mock ERC20 tokens
    const MockToken = await ethers.getContractFactory("MockERC20");
    mockToken = await MockToken.deploy("Mock Token", "MTK", 18);
    mockCollateralToken = await MockToken.deploy("Mock Collateral", "MCL", 18);

    // Deploy LendSmartLoan contract
    const LendSmartLoan = await ethers.getContractFactory("LendSmartLoan");
    lendSmartLoan = await LendSmartLoan.deploy(
      owner.address,
      PLATFORM_FEE,
      feeRecipient.address,
      riskAssessor.address
    );

    // Mint tokens to borrower and lender
    await mockToken.mint(lender.address, ethers.parseUnits("10000", 18));
    await mockCollateralToken.mint(borrower.address, ethers.parseUnits("10000", 18));

    // Approve contract to spend tokens
    await mockToken.connect(lender).approve(lendSmartLoan.target, ethers.parseUnits("10000", 18));
    await mockCollateralToken.connect(borrower).approve(lendSmartLoan.target, ethers.parseUnits("10000", 18));
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await lendSmartLoan.owner()).to.equal(owner.address);
    });

    it("Should set the correct fee recipient", async function () {
      expect(await lendSmartLoan.feeRecipient()).to.equal(feeRecipient.address);
    });

    it("Should set the correct risk assessor", async function () {
      expect(await lendSmartLoan.riskAssessor()).to.equal(riskAssessor.address);
    });

    it("Should set the correct platform fee", async function () {
      expect(await lendSmartLoan.platformFeeRate()).to.equal(PLATFORM_FEE);
    });
  });

  describe("Loan Request", function () {
    it("Should allow a borrower to request a non-collateralized loan", async function () {
      const tx = await lendSmartLoan.connect(borrower).requestLoan(
        mockToken.target,
        LOAN_AMOUNT,
        INTEREST_RATE,
        LOAN_DURATION,
        "Business expansion",
        false, // not collateralized
        ethers.ZeroAddress,
        0
      );

      const receipt = await tx.wait();
      const loanId = 1; // First loan ID should be 1

      // Check event emission
      const event = receipt.logs.find(
        log => log.fragment && log.fragment.name === 'LoanRequested'
      );
      expect(event).to.not.be.undefined;

      // Check loan details
      const loan = await lendSmartLoan.loans(loanId);
      expect(loan.borrower).to.equal(borrower.address);
      expect(loan.principal).to.equal(LOAN_AMOUNT);
      expect(loan.interestRate).to.equal(INTEREST_RATE);
      expect(loan.duration).to.equal(LOAN_DURATION);
      expect(loan.status).to.equal(0); // LoanStatus.Requested
      expect(loan.isCollateralized).to.be.false;
    });

    it("Should allow a borrower to request a collateralized loan", async function () {
      const tx = await lendSmartLoan.connect(borrower).requestLoan(
        mockToken.target,
        LOAN_AMOUNT,
        INTEREST_RATE,
        LOAN_DURATION,
        "Home renovation",
        true, // collateralized
        mockCollateralToken.target,
        COLLATERAL_AMOUNT
      );

      const receipt = await tx.wait();
      const loanId = 1; // First loan ID should be 1

      // Check loan details
      const loan = await lendSmartLoan.loans(loanId);
      expect(loan.isCollateralized).to.be.true;
      expect(loan.collateralToken).to.equal(mockCollateralToken.target);
      expect(loan.collateralAmount).to.equal(COLLATERAL_AMOUNT);
    });

    it("Should reject loan requests with invalid parameters", async function () {
      // Zero token address
      await expect(
        lendSmartLoan.connect(borrower).requestLoan(
          ethers.ZeroAddress,
          LOAN_AMOUNT,
          INTEREST_RATE,
          LOAN_DURATION,
          "Invalid loan",
          false,
          ethers.ZeroAddress,
          0
        )
      ).to.be.revertedWith("LendSmartLoan: Token address cannot be zero");

      // Zero principal
      await expect(
        lendSmartLoan.connect(borrower).requestLoan(
          mockToken.target,
          0,
          INTEREST_RATE,
          LOAN_DURATION,
          "Invalid loan",
          false,
          ethers.ZeroAddress,
          0
        )
      ).to.be.revertedWith("LendSmartLoan: Principal must be greater than zero");

      // Zero duration
      await expect(
        lendSmartLoan.connect(borrower).requestLoan(
          mockToken.target,
          LOAN_AMOUNT,
          INTEREST_RATE,
          0,
          "Invalid loan",
          false,
          ethers.ZeroAddress,
          0
        )
      ).to.be.revertedWith("LendSmartLoan: Duration must be greater than zero");

      // Collateralized loan with zero collateral token
      await expect(
        lendSmartLoan.connect(borrower).requestLoan(
          mockToken.target,
          LOAN_AMOUNT,
          INTEREST_RATE,
          LOAN_DURATION,
          "Invalid loan",
          true,
          ethers.ZeroAddress,
          COLLATERAL_AMOUNT
        )
      ).to.be.revertedWith("LendSmartLoan: Collateral token cannot be zero address");

      // Collateralized loan with zero collateral amount
      await expect(
        lendSmartLoan.connect(borrower).requestLoan(
          mockToken.target,
          LOAN_AMOUNT,
          INTEREST_RATE,
          LOAN_DURATION,
          "Invalid loan",
          true,
          mockCollateralToken.target,
          0
        )
      ).to.be.revertedWith("LendSmartLoan: Collateral amount must be greater than zero");
    });
  });

  describe("Risk Assessment", function () {
    let loanId;

    beforeEach(async function () {
      // Create a loan request
      const tx = await lendSmartLoan.connect(borrower).requestLoan(
        mockToken.target,
        LOAN_AMOUNT,
        INTEREST_RATE,
        LOAN_DURATION,
        "Business expansion",
        false,
        ethers.ZeroAddress,
        0
      );

      const receipt = await tx.wait();
      loanId = 1; // First loan ID should be 1
    });

    it("Should allow risk assessor to set risk score", async function () {
      const riskScore = 75;

      const tx = await lendSmartLoan.connect(riskAssessor).setLoanRiskScore(
        loanId,
        riskScore,
        false // don't reject
      );

      const receipt = await tx.wait();

      // Check event emission
      const event = receipt.logs.find(
        log => log.fragment && log.fragment.name === 'RiskScoreAssigned'
      );
      expect(event).to.not.be.undefined;

      // Check loan risk score
      const loan = await lendSmartLoan.loans(loanId);
      expect(loan.riskScore).to.equal(riskScore);
      expect(loan.status).to.equal(0); // Still in Requested state
    });

    it("Should allow risk assessor to reject high-risk loans", async function () {
      const riskScore = 90; // High risk

      const tx = await lendSmartLoan.connect(riskAssessor).setLoanRiskScore(
        loanId,
        riskScore,
        true // reject
      );

      const receipt = await tx.wait();

      // Check event emission
      const rejectEvent = receipt.logs.find(
        log => log.fragment && log.fragment.name === 'LoanRejected'
      );
      expect(rejectEvent).to.not.be.undefined;

      // Check loan status
      const loan = await lendSmartLoan.loans(loanId);
      expect(loan.status).to.equal(6); // LoanStatus.Rejected
    });

    it("Should prevent non-risk assessors from setting risk scores", async function () {
      await expect(
        lendSmartLoan.connect(otherAccount).setLoanRiskScore(
          loanId,
          50,
          false
        )
      ).to.be.revertedWith("LendSmartLoan: Caller is not the risk assessor");
    });
  });

  describe("Collateral Management", function () {
    let loanId;

    beforeEach(async function () {
      // Create a collateralized loan request
      const tx = await lendSmartLoan.connect(borrower).requestLoan(
        mockToken.target,
        LOAN_AMOUNT,
        INTEREST_RATE,
        LOAN_DURATION,
        "Home renovation",
        true,
        mockCollateralToken.target,
        COLLATERAL_AMOUNT
      );

      const receipt = await tx.wait();
      loanId = 1; // First loan ID should be 1
    });

    it("Should allow borrower to deposit collateral", async function () {
      const tx = await lendSmartLoan.connect(borrower).depositCollateral(loanId);
      const receipt = await tx.wait();

      // Check event emission
      const event = receipt.logs.find(
        log => log.fragment && log.fragment.name === 'CollateralDeposited'
      );
      expect(event).to.not.be.undefined;

      // Check collateral token balance of contract
      const contractBalance = await mockCollateralToken.balanceOf(lendSmartLoan.target);
      expect(contractBalance).to.equal(COLLATERAL_AMOUNT);
    });

    it("Should prevent non-borrowers from depositing collateral", async function () {
      await expect(
        lendSmartLoan.connect(otherAccount).depositCollateral(loanId)
      ).to.be.revertedWith("LendSmartLoan: Caller is not the borrower");
    });
  });

  describe("Loan Funding", function () {
    let loanId;

    beforeEach(async function () {
      // Create a loan request
      await lendSmartLoan.connect(borrower).requestLoan(
        mockToken.target,
        LOAN_AMOUNT,
        INTEREST_RATE,
        LOAN_DURATION,
        "Business expansion",
        false,
        ethers.ZeroAddress,
        0
      );

      loanId = 1; // First loan ID should be 1

      // Set risk score
      await lendSmartLoan.connect(riskAssessor).setLoanRiskScore(
        loanId,
        50, // Medium risk
        false // don't reject
      );
    });

    it("Should allow lender to fund a loan", async function () {
      const tx = await lendSmartLoan.connect(lender).fundLoan(loanId);
      const receipt = await tx.wait();

      // Check event emission
      const event = receipt.logs.find(
        log => log.fragment && log.fragment.name === 'LoanFunded'
      );
      expect(event).to.not.be.undefined;

      // Check loan status
      const loan = await lendSmartLoan.loans(loanId);
      expect(loan.status).to.equal(1); // LoanStatus.Funded
      expect(loan.lender).to.equal(lender.address);

      // Check token balances
      const contractBalance = await mockToken.balanceOf(lendSmartLoan.target);
      expect(contractBalance).to.equal(LOAN_AMOUNT);
    });

    it("Should prevent borrower from funding their own loan", async function () {
      // First mint tokens to borrower
      await mockToken.mint(borrower.address, LOAN_AMOUNT);
      await mockToken.connect(borrower).approve(lendSmartLoan.target, LOAN_AMOUNT);

      await expect(
        lendSmartLoan.connect(borrower).fundLoan(loanId)
      ).to.be.revertedWith("LendSmartLoan: Borrower cannot fund their own loan");
    });

    it("Should require collateral deposit for collateralized loans", async function () {
      // Create a collateralized loan
      await lendSmartLoan.connect(borrower).requestLoan(
        mockToken.target,
        LOAN_AMOUNT,
        INTEREST_RATE,
        LOAN_DURATION,
        "Home renovation",
        true,
        mockCollateralToken.target,
        COLLATERAL_AMOUNT
      );

      const collateralizedLoanId = 2;

      // Try to fund without collateral deposited
      await expect(
        lendSmartLoan.connect(lender).fundLoan(collateralizedLoanId)
      ).to.be.revertedWith("LendSmartLoan: Collateral not deposited");

      // Deposit collateral
      await lendSmartLoan.connect(borrower).depositCollateral(collateralizedLoanId);

      // Now funding should succeed
      await lendSmartLoan.connect(lender).fundLoan(collateralizedLoanId);

      const loan = await lendSmartLoan.loans(collateralizedLoanId);
      expect(loan.status).to.equal(1); // LoanStatus.Funded
    });
  });

  describe("Repayment Schedule", function () {
    let loanId;

    beforeEach(async function () {
      // Create and fund a loan
      await lendSmartLoan.connect(borrower).requestLoan(
        mockToken.target,
        LOAN_AMOUNT,
        INTEREST_RATE,
        LOAN_DURATION,
        "Business expansion",
        false,
        ethers.ZeroAddress,
        0
      );

      loanId = 1;

      await lendSmartLoan.connect(riskAssessor).setLoanRiskScore(loanId, 50, false);
      await lendSmartLoan.connect(lender).fundLoan(loanId);
    });

    it("Should create a valid repayment schedule", async function () {
      const numberOfPayments = 3;

      const tx = await lendSmartLoan.connect(borrower).createRepaymentSchedule(
        loanId,
        numberOfPayments
      );

      const receipt = await tx.wait();

      // Check event emission
      const event = receipt.logs.find(
        log => log.fragment && log.fragment.name === 'RepaymentScheduleCreated'
      );
      expect(event).to.not.be.undefined;

      // Check schedule details
      const loanDetails = await lendSmartLoan.getLoanDetails(loanId);
      expect(loanDetails.schedule.length).to.equal(numberOfPayments);
      expect(loanDetails.amounts.length).to.equal(numberOfPayments);

      // Verify schedule intervals
      const expectedInterval = LOAN_DURATION / numberOfPayments;
      for (let i = 1; i < numberOfPayments; i++) {
        const timeDiff = loanDetails.schedule[i] - loanDetails.schedule[i-1];
        expect(timeDiff).to.equal(expectedInterval);
      }
    });

    it("Should reject invalid repayment schedules", async function () {
      // Try to create schedule with zero payments
      await expect(
        lendSmartLoan.connect(borrower).createRepaymentSchedule(loanId, 0)
      ).to.be.revertedWith("LendSmartLoan: Number of payments must be greater than zero");

      // Try to create schedule with too many payments (causing interval to be too short)
      const tooManyPayments = 1000; // This would make intervals very small
      await lendSmartLoan.setMinRepaymentInterval(SECONDS_IN_DAY); // Set min interval to 1 day

      await expect(
        lendSmartLoan.connect(borrower).createRepaymentSchedule(loanId, tooManyPayments)
      ).to.be.revertedWith("LendSmartLoan: Payment interval too short");
    });
  });

  describe("Loan Disbursement", function () {
    let loanId;

    beforeEach(async function () {
      // Create and fund a loan
      await lendSmartLoan.connect(borrower).requestLoan(
        mockToken.target,
        LOAN_AMOUNT,
        INTEREST_RATE,
        LOAN_DURATION,
        "Business expansion",
        false,
        ethers.ZeroAddress,
        0
      );

      loanId = 1;

      await lendSmartLoan.connect(riskAssessor).setLoanRiskScore(loanId, 50, false);
      await lendSmartLoan.connect(lender).fundLoan(loanId);
    });

    it("Should disburse funds to borrower", async function () {
      const borrowerBalanceBefore = await mockToken.balanceOf(borrower.address);

      const tx = await lendSmartLoan.connect(borrower).disburseLoan(loanId);
      const receipt = await tx.wait();

      // Check event emission
      const event = receipt.logs.find(
        log => log.fragment && log.fragment.name === 'LoanDisbursed'
      );
      expect(event).to.not.be.undefined;

      // Check loan status
      const loan = await lendSmartLoan.loans(loanId);
      expect(loan.status).to.equal(2); // LoanStatus.Active
      expect(loan.disbursedTime).to.not.equal(0);

      // Check token balances
      const borrowerBalanceAfter = await mockToken.balanceOf(borrower.address);
      expect(borrowerBalanceAfter - borrowerBalanceBefore).to.equal(LOAN_AMOUNT);

      // Check reputation score update
      const borrowerScore = await lendSmartLoan.getUserReputationScore(borrower.address);
      expect(borrowerScore).to.be.gt(0);
    });

    it("Should allow lender to disburse funds", async function () {
      await lendSmartLoan.connect(lender).disburseLoan(loanId);

      const loan = await lendSmartLoan.loans(loanId);
      expect(loan.status).to.equal(2); // LoanStatus.Active
    });

    it("Should prevent unauthorized accounts from disbursing funds", async function () {
      await expect(
        lendSmartLoan.connect(otherAccount).disburseLoan(loanId)
      ).to.be.revertedWith("LendSmartLoan: Not authorized to disburse");
    });
  });

  describe("Loan Repayment", function () {
    let loanId;
    let repaymentAmount;

    beforeEach(async function () {
      // Create, fund, and disburse a loan
      await lendSmartLoan.connect(borrower).requestLoan(
        mockToken.target,
        LOAN_AMOUNT,
        INTEREST_RATE,
        LOAN_DURATION,
        "Business expansion",
        false,
        ethers.ZeroAddress,
        0
      );

      loanId = 1;

      await lendSmartLoan.connect(riskAssessor).setLoanRiskScore(loanId, 50, false);
      await lendSmartLoan.connect(lender).fundLoan(loanId);
      await lendSmartLoan.connect(borrower).disburseLoan(loanId);

      // Calculate repayment amount (principal + interest)
      const loan = await lendSmartLoan.loans(loanId);
      repaymentAmount = loan.repaymentAmount;

      // Mint repayment tokens to borrower
      await mockToken.mint(borrower.address, repaymentAmount);
      await mockToken.connect(borrower).approve(lendSmartLoan.target, repaymentAmount);
    });

    it("Should allow borrower to make partial repayment", async function () {
      const partialAmount = repaymentAmount / 2n;

      const tx = await lendSmartLoan.connect(borrower).repayLoan(loanId, partialAmount);
      const receipt = await tx.wait();

      // Check event emission
      const event = receipt.logs.find(
        log => log.fragment && log.fragment.name === 'LoanRepaid'
      );
      expect(event).to.not.be.undefined;

      // Check loan status and repayment amount
      const loan = await lendSmartLoan.loans(loanId);
      expect(loan.status).to.equal(2); // Still Active
      expect(loan.amountRepaid).to.equal(partialAmount);
    });

    it("Should allow borrower to fully repay loan", async function () {
      const tx = await lendSmartLoan.connect(borrower).repayLoan(loanId, repaymentAmount);
      const receipt = await tx.wait();

      // Check loan status
      const loan = await lendSmartLoan.loans(loanId);
      expect(loan.status).to.equal(3); // LoanStatus.Repaid
      expect(loan.amountRepaid).to.equal(repaymentAmount);

      // Check reputation score update
      const borrowerScore = await lendSmartLoan.getUserReputationScore(borrower.address);
      expect(borrowerScore).to.be.gt(1); // Should be higher after repayment
    });

    it("Should handle overpayment correctly", async function () {
      const overpaymentAmount = repaymentAmount * 2n;

      // Mint extra tokens for overpayment
      await mockToken.mint(borrower.address, overpaymentAmount);
      await mockToken.connect(borrower).approve(lendSmartLoan.target, overpaymentAmount);

      await lendSmartLoan.connect(borrower).repayLoan(loanId, overpaymentAmount);

      // Check loan status and repayment amount
      const loan = await lendSmartLoan.loans(loanId);
      expect(loan.status).to.equal(3); // LoanStatus.Repaid
      expect(loan.amountRepaid).to.equal(repaymentAmount); // Should only record the required amount
    });

    it("Should distribute platform fees correctly", async function () {
      const feeRecipientBalanceBefore = await mockToken.balanceOf(feeRecipient.address);

      await lendSmartLoan.connect(borrower).repayLoan(loanId, repaymentAmount);

      const feeRecipientBalanceAfter = await mockToken.balanceOf(feeRecipient.address);
      expect(feeRecipientBalanceAfter).to.be.gt(feeRecipientBalanceBefore);

      // Calculate expected fee
      const loan = await lendSmartLoan.loans(loanId);
      const interest = repaymentAmount - LOAN_AMOUNT;
      const expectedFee = (interest * BigInt(PLATFORM_FEE)) / 10000n;

      expect(feeRecipientBalanceAfter - feeRecipientBalanceBefore).to.equal(expectedFee);
    });
  });

  describe("Collateralized Loan Lifecycle", function () {
    let collateralizedLoanId;
    let repaymentAmount;

    beforeEach(async function () {
      // Create a collateralized loan
      await lendSmartLoan.connect(borrower).requestLoan(
        mockToken.target,
        LOAN_AMOUNT,
        INTEREST_RATE,
        LOAN_DURATION,
        "Home renovation",
        true,
        mockCollateralToken.target,
        COLLATERAL_AMOUNT
      );

      collateralizedLoanId = 1;

      // Deposit collateral
      await lendSmartLoan.connect(borrower).depositCollateral(collateralizedLoanId);

      // Fund and disburse loan
      await lendSmartLoan.connect(riskAssessor).setLoanRiskScore(collateralizedLoanId, 50, false);
      await lendSmartLoan.connect(lender).fundLoan(collateralizedLoanId);
      await lendSmartLoan.connect(borrower).disburseLoan(collateralizedLoanId);

      // Get repayment amount
      const loan = await lendSmartLoan.loans(collateralizedLoanId);
      repaymentAmount = loan.repaymentAmount;

      // Mint repayment tokens to borrower
      await mockToken.mint(borrower.address, repaymentAmount);
      await mockToken.connect(borrower).approve(lendSmartLoan.target, repaymentAmount);
    });

    it("Should release collateral to borrower after full repayment", async function () {
      const borrowerCollateralBefore = await mockCollateralToken.balanceOf(borrower.address);

      // Repay loan
      await lendSmartLoan.connect(borrower).repayLoan(collateralizedLoanId, repaymentAmount);

      // Check collateral release
      const borrowerCollateralAfter = await mockCollateralToken.balanceOf(borrower.address);
      expect(borrowerCollateralAfter - borrowerCollateralBefore).to.equal(COLLATERAL_AMOUNT);

      // Check contract collateral balance
      const contractCollateralBalance = await mockCollateralToken.balanceOf(lendSmartLoan.target);
      expect(contractCollateralBalance).to.equal(0);
    });

    it("Should transfer collateral to lender on default", async function () {
      const lenderCollateralBefore = await mockCollateralToken.balanceOf(lender.address);

      // Advance time past loan duration + grace period
      await ethers.provider.send("evm_increaseTime", [LOAN_DURATION + 4 * SECONDS_IN_DAY]);
      await ethers.provider.send("evm_mine");

      // Mark loan as defaulted
      await lendSmartLoan.connect(lender).markLoanAsDefaulted(collateralizedLoanId);

      // Check collateral transfer to lender
      const lenderCollateralAfter = await mockCollateralToken.balanceOf(lender.address);
      expect(lenderCollateralAfter - lenderCollateralBefore).to.equal(COLLATERAL_AMOUNT);

      // Check loan status
      const loan = await lendSmartLoan.loans(collateralizedLoanId);
      expect(loan.status).to.equal(4); // LoanStatus.Defaulted

      // Check borrower reputation score decrease
      const borrowerScore = await lendSmartLoan.getUserReputationScore(borrower.address);
      expect(borrowerScore).to.equal(0); // Should be reduced to 0 after default
    });
  });

  describe("Loan Cancellation", function () {
    let loanId;

    beforeEach(async function () {
      // Create a loan request
      await lendSmartLoan.connect(borrower).requestLoan(
        mockToken.target,
        LOAN_AMOUNT,
        INTEREST_RATE,
        LOAN_DURATION,
        "Business expansion",
        false,
        ethers.ZeroAddress,
        0
      );

      loanId = 1;
    });

    it("Should allow borrower to cancel unfunded loan", async function () {
      const tx = await lendSmartLoan.connect(borrower).cancelLoanRequest(loanId);
      const receipt = await tx.wait();

      // Check event emission
      const event = receipt.logs.find(
        log => log.fragment && log.fragment.name === 'LoanCancelled'
      );
      expect(event).to.not.be.undefined;

      // Check loan status
      const loan = await lendSmartLoan.loans(loanId);
      expect(loan.status).to.equal(5); // LoanStatus.Cancelled
    });

    it("Should prevent cancellation of funded loans", async function () {
      // Fund the loan
      await lendSmartLoan.connect(riskAssessor).setLoanRiskScore(loanId, 50, false);
      await lendSmartLoan.connect(lender).fundLoan(loanId);

      // Try to cancel
      await expect(
        lendSmartLoan.connect(borrower).cancelLoanRequest(loanId)
      ).to.be.revertedWith("LendSmartLoan: Loan not in Requested state or already funded");
    });

    it("Should return collateral when cancelling collateralized loan", async function () {
      // Create a collateralized loan
      await lendSmartLoan.connect(borrower).requestLoan(
        mockToken.target,
        LOAN_AMOUNT,
        INTEREST_RATE,
        LOAN_DURATION,
        "Home renovation",
        true,
        mockCollateralToken.target,
        COLLATERAL_AMOUNT
      );

      const collateralizedLoanId = 2;

      // Deposit collateral
      await lendSmartLoan.connect(borrower).depositCollateral(collateralizedLoanId);

      const borrowerCollateralBefore = await mockCollateralToken.balanceOf(borrower.address);

      // Cancel loan
      await lendSmartLoan.connect(borrower).cancelLoanRequest(collateralizedLoanId);

      // Check collateral return
      const borrowerCollateralAfter = await mockCollateralToken.balanceOf(borrower.address);
      expect(borrowerCollateralAfter - borrowerCollateralBefore).to.equal(COLLATERAL_AMOUNT);
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to update platform fee rate", async function () {
      const newFeeRate = 200; // 2.00%

      await lendSmartLoan.connect(owner).setPlatformFeeRate(newFeeRate);

      expect(await lendSmartLoan.platformFeeRate()).to.equal(newFeeRate);
    });

    it("Should allow owner to update fee recipient", async function () {
      const newFeeRecipient = otherAccount.address;

      await lendSmartLoan.connect(owner).setFeeRecipient(newFeeRecipient);

      expect(await lendSmartLoan.feeRecipient()).to.equal(newFeeRecipient);
    });

    it("Should allow owner to update risk assessor", async function () {
      const newRiskAssessor = otherAccount.address;

      await lendSmartLoan.connect(owner).setRiskAssessor(newRiskAssessor);

      expect(await lendSmartLoan.riskAssessor()).to.equal(newRiskAssessor);
    });
        it("Should allow owner to pause and unpause the contract", async function () {
      // Pause contract
      await lendSmartLoan.connect(owner).pause();

      // Try to request loan while paused
      await expect(
        lendSmartLoan.connect(borrower).requestLoan(
          mockToken.target,
          LOAN_AMOUNT,
          INTEREST_RATE,
          LOAN_DURATION,
          "Business expansion",
          false,
          ethers.ZeroAddress,
          0
        )
      ).to.be.revertedWithCustomError(lendSmartLoan, "EnforcedPause");

      // Unpause contract
      await lendSmartLoan.connect(owner).unpause();

      // Should work now
      await lendSmartLoan.connect(borrower).requestLoan(
        mockToken.target,
        LOAN_AMOUNT,
        INTEREST_RATE,
        LOAN_DURATION,
        "Business expansion",
        false,
        ethers.ZeroAddress,
        0
      );
    });;

    it("Should prevent non-owners from calling admin functions", async function () {
      await expect(
        lendSmartLoan.connect(otherAccount).setPlatformFeeRate(200)
      ).to.be.revertedWithCustomError(lendSmartLoan, "OwnableUnauthorizedAccount");

      await expect(
        lendSmartLoan.connect(otherAccount).setFeeRecipient(otherAccount.address)
      ).to.be.revertedWithCustomError(lendSmartLoan, "OwnableUnauthorizedAccount");

      await expect(
        lendSmartLoan.connect(otherAccount).pause()
      ).to.be.revertedWithCustomError(lendSmartLoan, "OwnableUnauthorizedAccount");
    });
  });
});
