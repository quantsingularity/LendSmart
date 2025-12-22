// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/security/ReentrancyGuard.sol';

/**
 * @title BorrowerContract
 * @dev A contract representing a single loan instance for a borrower.
 * This can be used for more complex loan logic or as a proxy.
 */
contract BorrowerContract is ReentrancyGuard {
    address public borrower;
    address public loanManager;
    uint256 public loanAmount;
    uint256 public interestRate;
    uint256 public repaymentDeadline;
    uint256 public repaidAmount;
    bool public isActive;

    event RepaymentMade(uint256 amount, uint256 remainingBalance);
    event LoanDefaulted();
    event LoanFullyRepaid();

    modifier onlyBorrower() {
        require(msg.sender == borrower, 'Only borrower can call this function');
        _;
    }

    modifier onlyActive() {
        require(isActive, 'Loan is not active');
        _;
    }

    constructor(
        address _borrower,
        address _loanManager,
        uint256 _amount,
        uint256 _interest,
        uint256 _durationDays
    ) {
        borrower = _borrower;
        loanManager = _loanManager;
        loanAmount = _amount;
        interestRate = _interest;
        repaymentDeadline = block.timestamp + (_durationDays * 1 days);
        repaidAmount = 0;
        isActive = true;
    }

    /**
     * @dev Calculates total amount to be repaid (principal + interest).
     */
    function getTotalOwed() public view returns (uint256) {
        return loanAmount + (loanAmount * interestRate) / 100;
    }

    /**
     * @dev Calculates remaining balance to be repaid.
     */
    function getRemainingBalance() public view returns (uint256) {
        uint256 totalOwed = getTotalOwed();
        if (repaidAmount >= totalOwed) return 0;
        return totalOwed - repaidAmount;
    }

    /**
     * @dev Repays the loan.
     */
    function repayLoan() external payable onlyBorrower onlyActive nonReentrant {
        require(block.timestamp <= repaymentDeadline, 'Loan has expired, check default status');
        require(msg.value > 0, 'Payment must be greater than 0');

        uint256 remainingBalance = getRemainingBalance();
        uint256 paymentAmount = msg.value;
        uint256 refundAmount = 0;

        if (paymentAmount >= remainingBalance) {
            refundAmount = paymentAmount - remainingBalance;
            paymentAmount = remainingBalance;
            repaidAmount = getTotalOwed();
            isActive = false;
            emit LoanFullyRepaid();
        } else {
            repaidAmount += paymentAmount;
        }

        // Transfer payment to loan manager (or lender directly if configured)
        (bool success, ) = payable(loanManager).call{value: paymentAmount}('');
        require(success, 'Transfer to loan manager failed');

        // Refund excess funds
        if (refundAmount > 0) {
            (bool refundSuccess, ) = payable(borrower).call{value: refundAmount}('');
            require(refundSuccess, 'Refund to borrower failed');
        }

        emit RepaymentMade(paymentAmount, getRemainingBalance());
    }

    /**
     * @dev Checks if the loan has defaulted.
     */
    function checkDefault() external returns (bool) {
        if (block.timestamp > repaymentDeadline && isActive) {
            isActive = false;
            emit LoanDefaulted();
            return true;
        }
        return false;
    }

    /**
     * @dev Returns the current status of the loan.
     */
    function getRepaymentStatus()
        external
        view
        returns (
            uint256 totalOwed,
            uint256 amountRepaid,
            uint256 remainingBalance,
            uint256 deadline,
            bool active
        )
    {
        return (getTotalOwed(), repaidAmount, getRemainingBalance(), repaymentDeadline, isActive);
    }

    /**
     * @dev Fallback to receive funds.
     */
    receive() external payable {
        revert('Use repayLoan() to make payments');
    }
}
