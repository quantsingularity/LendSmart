// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/utils/ReentrancyGuard.sol';
import '@openzeppelin/contracts/utils/Pausable.sol';

/**
 * @title LoanContract
 * @dev A smart contract for managing peer-to-peer lending agreements.
 * This contract allows borrowers to request loans, lenders to fund them,
 * and manages the disbursement and repayment process.
 * It assumes an ERC20 token is used for lending and repayment.
 */
contract LoanContract is Ownable, ReentrancyGuard, Pausable {
  struct Loan {
    uint256 id;
    address borrower;
    address lender;
    address token; // Address of the ERC20 token used for the loan
    uint256 principal;
    uint256 interestRate; // Annual interest rate, e.g., 500 for 5.00%
    uint256 duration; // Loan duration in seconds
    uint256 requestedTime;
    uint256 fundedTime;
    uint256 repaymentAmount; // Principal + Interest
    uint256 amountRepaid;
    LoanStatus status;
    string purpose; // Purpose of the loan, stored off-chain or via IPFS hash
  }

  enum LoanStatus {
    Requested, // Loan request created by borrower
    Funded, // Loan funded by lender, awaiting borrower withdrawal or automatic disbursement
    Active, // Funds disbursed to borrower, repayment period started
    Repaid, // Loan fully repaid by borrower
    Defaulted, // Loan not repaid by due date
    Cancelled // Loan request cancelled by borrower before funding
  }

  uint256 public nextLoanId;
  mapping(uint256 => Loan) public loans;
  mapping(address => uint256[]) public userLoanIds; // Borrower or Lender to their loan IDs

  uint256 public platformFeeRate; // e.g., 100 for 1.00% fee on interest
  address public feeRecipient; // Address to receive platform fees

  event LoanRequested(
    uint256 indexed loanId,
    address indexed borrower,
    address indexed token,
    uint256 principal,
    uint256 interestRate,
    uint256 duration,
    string purpose
  );
  event LoanFunded(uint256 indexed loanId, address indexed lender, uint256 fundedTime);
  event LoanDisbursed(uint256 indexed loanId, address indexed borrower, uint256 amount);
  event LoanRepaid(
    uint256 indexed loanId,
    address indexed borrower,
    uint256 amountPaid,
    uint256 totalRepaid
  );
  event LoanDefaulted(uint256 indexed loanId);
  event LoanCancelled(uint256 indexed loanId);
  event PlatformFeeUpdated(uint256 newFeeRate);
  event FeeRecipientUpdated(address newFeeRecipient);

  modifier onlyBorrower(uint256 _loanId) {
    require(loans[_loanId].borrower == msg.sender, 'LoanContract: Caller is not the borrower');
    _;
  }

  modifier onlyLender(uint256 _loanId) {
    require(loans[_loanId].lender == msg.sender, 'LoanContract: Caller is not the lender');
    _;
  }

  modifier loanExists(uint256 _loanId) {
    require(loans[_loanId].borrower != address(0), 'LoanContract: Loan does not exist');
    _;
  }

  /**
   * @dev Constructor to initialize the contract owner, platform fee, and fee recipient.
   * @param _initialOwner The address of the contract owner.
   * @param _initialFeeRate The initial platform fee rate (e.g., 100 for 1.00%).
   * @param _initialFeeRecipient The address where platform fees will be sent.
   */
  constructor(
    address _initialOwner,
    uint256 _initialFeeRate,
    address _initialFeeRecipient
  ) Ownable(_initialOwner) {
    require(_initialFeeRecipient != address(0), 'Fee recipient cannot be zero address');
    platformFeeRate = _initialFeeRate;
    feeRecipient = _initialFeeRecipient;
    nextLoanId = 1; // Start loan IDs from 1
  }

  /**
   * @dev Allows a borrower to request a new loan.
   * @param _token The address of the ERC20 token for the loan.
   * @param _principal The amount of tokens requested.
   * @param _interestRate The annual interest rate (e.g., 500 for 5.00%).
   * @param _duration The duration of the loan in seconds.
   * @param _purpose A description or IPFS hash for the loan purpose.
   */
  function requestLoan(
    address _token,
    uint256 _principal,
    uint256 _interestRate,
    uint256 _duration,
    string memory _purpose
  ) external whenNotPaused nonReentrant returns (uint256) {
    require(_token != address(0), 'LoanContract: Token address cannot be zero');
    require(_principal > 0, 'LoanContract: Principal must be greater than zero');
    require(_duration > 0, 'LoanContract: Duration must be greater than zero');
    // Interest rate can be 0 for interest-free loans

    uint256 loanId = nextLoanId++;
    uint256 totalInterest = (_principal * _interestRate * _duration) / (10000 * 365 days); // 10000 for rate precision (e.g. 5.00% = 500)
    uint256 repaymentAmount = _principal + totalInterest;

    loans[loanId] = Loan({
      id: loanId,
      borrower: msg.sender,
      lender: address(0),
      token: _token,
      principal: _principal,
      interestRate: _interestRate,
      duration: _duration,
      requestedTime: block.timestamp,
      fundedTime: 0,
      repaymentAmount: repaymentAmount,
      amountRepaid: 0,
      status: LoanStatus.Requested,
      purpose: _purpose
    });

    userLoanIds[msg.sender].push(loanId);

    emit LoanRequested(loanId, msg.sender, _token, _principal, _interestRate, _duration, _purpose);
    return loanId;
  }

  /**
   * @dev Allows a lender to fund an existing loan request.
   * The lender must have approved the contract to spend their tokens.
   * @param _loanId The ID of the loan to fund.
   */
  function fundLoan(uint256 _loanId) external whenNotPaused nonReentrant loanExists(_loanId) {
    Loan storage loan = loans[_loanId];
    require(loan.status == LoanStatus.Requested, 'LoanContract: Loan not in Requested state');
    require(msg.sender != loan.borrower, 'LoanContract: Borrower cannot fund their own loan');

    IERC20 token = IERC20(loan.token);
    require(
      token.balanceOf(msg.sender) >= loan.principal,
      'LoanContract: Insufficient token balance'
    );
    require(
      token.allowance(msg.sender, address(this)) >= loan.principal,
      'LoanContract: Contract not approved to spend tokens'
    );

    // Transfer principal from lender to this contract
    bool success = token.transferFrom(msg.sender, address(this), loan.principal);
    require(success, 'LoanContract: Token transferFrom failed');

    loan.lender = msg.sender;
    loan.fundedTime = block.timestamp;
    loan.status = LoanStatus.Funded;

    userLoanIds[msg.sender].push(_loanId);

    emit LoanFunded(_loanId, msg.sender, loan.fundedTime);

    // Optional: Automatically disburse after funding, or require borrower to withdraw
    // For this example, we will make it automatic for simplicity
    _disburseLoan(_loanId);
  }

  /**
   * @dev Internal function to disburse funds to the borrower.
   * Can be called after funding or by borrower if designed that way.
   * @param _loanId The ID of the loan to disburse.
   */
  function _disburseLoan(uint256 _loanId) internal {
    Loan storage loan = loans[_loanId];
    // require(loan.status == LoanStatus.Funded, "LoanContract: Loan not in Funded state");
    // require(msg.sender == loan.borrower || msg.sender == address(this), "LoanContract: Not authorized to disburse"); // if borrower initiated

    IERC20 token = IERC20(loan.token);
    bool success = token.transfer(loan.borrower, loan.principal);
    require(success, 'LoanContract: Token transfer to borrower failed');

    loan.status = LoanStatus.Active;
    emit LoanDisbursed(_loanId, loan.borrower, loan.principal);
  }

  /**
   * @dev Allows a borrower to repay their loan.
   * The borrower must have approved the contract to spend their tokens.
   * @param _loanId The ID of the loan to repay.
   * @param _amount The amount of tokens to repay.
   */
  function repayLoan(
    uint256 _loanId,
    uint256 _amount
  ) external whenNotPaused nonReentrant loanExists(_loanId) onlyBorrower(_loanId) {
    Loan storage loan = loans[_loanId];
    require(loan.status == LoanStatus.Active, 'LoanContract: Loan not in Active state');
    require(_amount > 0, 'LoanContract: Repayment amount must be greater than zero');

    IERC20 token = IERC20(loan.token);
    require(
      token.balanceOf(msg.sender) >= _amount,
      'LoanContract: Insufficient token balance for repayment'
    );
    require(
      token.allowance(msg.sender, address(this)) >= _amount,
      'LoanContract: Contract not approved to spend tokens for repayment'
    );

    uint256 amountToRepayThisTime = _amount;
    if (loan.amountRepaid + _amount > loan.repaymentAmount) {
      amountToRepayThisTime = loan.repaymentAmount - loan.amountRepaid; // Pay only remaining due
    }

    // Transfer repayment from borrower to this contract
    bool success = token.transferFrom(msg.sender, address(this), amountToRepayThisTime);
    require(success, 'LoanContract: Repayment token transferFrom failed');

    loan.amountRepaid += amountToRepayThisTime;

    // Distribute funds: principal and interest to lender, fee to platform
    uint256 interestPortion = 0;
    uint256 principalPortion = amountToRepayThisTime;

    if (loan.amountRepaid > loan.principal) {
      // If repayment starts covering interest
      uint256 totalInterestPaidSoFar = loan.amountRepaid - loan.principal;
      uint256 totalInterestDue = loan.repaymentAmount - loan.principal;
      uint256 interestPaidThisTime = amountToRepayThisTime;
      if (loan.amountRepaid - amountToRepayThisTime < loan.principal) {
        // If this payment crosses principal boundary
        interestPaidThisTime = loan.amountRepaid - loan.principal;
      }
      if (interestPaidThisTime > totalInterestDue) interestPaidThisTime = totalInterestDue;

      interestPortion = interestPaidThisTime;
      principalPortion = amountToRepayThisTime - interestPortion;
    } else {
      // This payment is still part of principal
    }

    uint256 platformFee = 0;
    if (interestPortion > 0 && platformFeeRate > 0) {
      platformFee = (interestPortion * platformFeeRate) / 10000;
      if (platformFee > 0) {
        bool feeSuccess = token.transfer(feeRecipient, platformFee);
        require(feeSuccess, 'LoanContract: Platform fee transfer failed');
      }
    }

    uint256 amountToLender = amountToRepayThisTime - platformFee;
    if (amountToLender > 0) {
      bool lenderSuccess = token.transfer(loan.lender, amountToLender);
      require(lenderSuccess, 'LoanContract: Transfer to lender failed');
    }

    emit LoanRepaid(_loanId, msg.sender, amountToRepayThisTime, loan.amountRepaid);

    if (loan.amountRepaid >= loan.repaymentAmount) {
      loan.status = LoanStatus.Repaid;
    }

    // Check for default status (simplified: if past due date and not fully repaid)
    // More complex default logic would involve checking block.timestamp against loan.fundedTime + loan.duration
    if (loan.status != LoanStatus.Repaid && block.timestamp > loan.fundedTime + loan.duration) {
      loan.status = LoanStatus.Defaulted;
      emit LoanDefaulted(_loanId);
    }
  }

  /**
   * @dev Allows a borrower to cancel their loan request if it has not been funded yet.
   * @param _loanId The ID of the loan to cancel.
   */
  function cancelLoanRequest(
    uint256 _loanId
  ) external whenNotPaused nonReentrant loanExists(_loanId) onlyBorrower(_loanId) {
    Loan storage loan = loans[_loanId];
    require(
      loan.status == LoanStatus.Requested,
      'LoanContract: Loan not in Requested state or already funded'
    );

    loan.status = LoanStatus.Cancelled;
    emit LoanCancelled(_loanId);
  }

  /**
   * @dev Allows the owner to update the platform fee rate.
   * @param _newFeeRate The new platform fee rate (e.g., 150 for 1.50%).
   */
  function setPlatformFeeRate(uint256 _newFeeRate) external onlyOwner {
    // Add upper bound check for fee rate if necessary
    // require(_newFeeRate <= 500, "Fee rate too high"); // e.g. max 5%
    platformFeeRate = _newFeeRate;
    emit PlatformFeeUpdated(_newFeeRate);
  }

  /**
   * @dev Allows the owner to update the fee recipient address.
   * @param _newFeeRecipient The new address for receiving platform fees.
   */
  function setFeeRecipient(address _newFeeRecipient) external onlyOwner {
    require(
      _newFeeRecipient != address(0),
      'LoanContract: New fee recipient cannot be zero address'
    );
    feeRecipient = _newFeeRecipient;
    emit FeeRecipientUpdated(_newFeeRecipient);
  }

  /**
   * @dev Allows the owner to pause the contract in case of emergencies.
   */
  function pause() external onlyOwner {
    _pause();
  }

  /**
   * @dev Allows the owner to unpause the contract.
   */
  function unpause() external onlyOwner {
    _unpause();
  }

  /**
   * @dev Retrieves all loan IDs associated with a user (borrower or lender).
   * @param _user The address of the user.
   * @return An array of loan IDs.
   */
  function getUserLoans(address _user) external view returns (uint256[] memory) {
    return userLoanIds[_user];
  }

  /**
   * @dev Retrieves details for a specific loan.
   * @param _loanId The ID of the loan.
   * @return The Loan struct.
   */
  function getLoanDetails(uint256 _loanId) external view loanExists(_loanId) returns (Loan memory) {
    return loans[_loanId];
  }

  /**
   * @dev Fallback function to receive Ether (e.g., if someone sends ETH directly).
   * It is recommended to make this function revert or handle ETH appropriately if not intended.
   */
  receive() external payable {
    // Optionally handle received Ether, e.g., for gas refunds or revert
    // For this contract, direct ETH payments are not part of the core logic for ERC20 loans.
    // Reverting is safer if ETH is not meant to be held by the contract this way.
    revert(
      'LoanContract: Direct Ether payments not accepted. Use specific functions for ERC20 loan operations.'
    );
  }

  // Owner can withdraw any ERC20 tokens accidentally sent to the contract
  // (excluding the loan tokens which are managed by the loan lifecycle)
  function withdrawStuckTokens(
    address _tokenAddress,
    address _to,
    uint256 _amount
  ) external onlyOwner {
    require(_to != address(0), 'Cannot send to zero address');
    IERC20 token = IERC20(_tokenAddress);
    // Basic check: ensure we are not withdrawing tokens that are part of active loan principals held by contract
    // This is a simplified check. A more robust check would sum up all principals held by the contract.
    // For now, this function is risky if not used carefully.
    // A safer approach might be to only allow withdrawal of specific, non-loan tokens.
    require(token.balanceOf(address(this)) >= _amount, 'Insufficient balance of specified token');
    token.transfer(_to, _amount);
  }
}
