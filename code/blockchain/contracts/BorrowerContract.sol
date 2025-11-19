// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./LoanManager.sol";

contract BorrowerContract {
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
        require(msg.sender == borrower, "Only borrower can call this function");
        _;
    }

    modifier onlyActive() {
        require(isActive, "Loan is not active");
        _;
    }

    constructor(address _loanManager, uint256 _amount, uint256 _interest, uint256 _durationDays) {
        borrower = msg.sender;
        loanManager = _loanManager;
        loanAmount = _amount;
        interestRate = _interest;
        repaymentDeadline = block.timestamp + (_durationDays * 1 days);
        repaidAmount = 0;
        isActive = true;
    }

    function getTotalOwed() public view returns(uint256) {
        return loanAmount + (loanAmount * interestRate) / 100;
    }

    function getRemainingBalance() public view returns(uint256) {
        return getTotalOwed() - repaidAmount;
    }

    function repayLoan() external payable onlyBorrower onlyActive {
        require(block.timestamp <= repaymentDeadline, "Loan has expired");
        require(msg.value > 0, "Payment must be greater than 0");

        uint256 remainingBalance = getRemainingBalance();

        if (msg.value >= remainingBalance) {
            // Full repayment
            repaidAmount = getTotalOwed();
            isActive = false;

            // Transfer payment to loan manager
            payable(loanManager).transfer(remainingBalance);

            // Return excess funds if any
            if (msg.value > remainingBalance) {
                payable(borrower).transfer(msg.value - remainingBalance);
            }

            emit RepaymentMade(remainingBalance, 0);
            emit LoanFullyRepaid();
        } else {
            // Partial repayment
            repaidAmount += msg.value;

            // Transfer payment to loan manager
            payable(loanManager).transfer(msg.value);

            emit RepaymentMade(msg.value, getRemainingBalance());
        }
    }

    function checkDefault() external returns(bool) {
        if (block.timestamp > repaymentDeadline && isActive) {
            isActive = false;
            emit LoanDefaulted();
            return true;
        }
        return false;
    }

    function getRepaymentStatus() external view returns(uint256 totalOwed, uint256 amountRepaid, uint256 remainingBalance, uint256 deadline, bool active) {
        return (
            getTotalOwed(),
            repaidAmount,
            getRemainingBalance(),
            repaymentDeadline,
            isActive
        );
    }
}
