// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract BorrowerContract {
    address public borrower;
    uint256 public loanAmount;
    uint256 public interestRate;
    uint256 public repaymentDeadline;
    
    event RepaymentMade(uint256 amount);
    event LoanDefaulted();

    constructor(uint256 _amount, uint256 _interest, uint256 _durationDays) {
        borrower = msg.sender;
        loanAmount = _amount;
        interestRate = _interest;
        repaymentDeadline = block.timestamp + (_durationDays * 1 days);
    }

    function repayLoan() external payable {
        require(block.timestamp <= repaymentDeadline, "Loan expired");
        uint256 totalOwed = loanAmount + (loanAmount * interestRate) / 100;
        require(msg.value >= totalOwed, "Insufficient repayment");
        emit RepaymentMade(msg.value);
    }

    function checkDefault() external view returns(bool) {
        return block.timestamp > repaymentDeadline;
    }
}