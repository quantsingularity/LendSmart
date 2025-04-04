// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract LoanManager {
    enum LoanStatus { PENDING, APPROVED, REPAID, DEFAULTED }
    
    struct Loan {
        address borrower;
        uint256 amount;
        uint256 interestRate;
        uint256 duration;
        LoanStatus status;
        uint256 dueDate;
    }
    
    mapping(address => Loan[]) public borrowerLoans;
    Loan[] public allLoans;
    
    event LoanCreated(address indexed borrower, uint256 loanId);
    event LoanApproved(uint256 loanId, address lender);

    function createLoan(uint256 amount, uint256 interest, uint256 durationDays) external {
        Loan memory newLoan = Loan({
            borrower: msg.sender,
            amount: amount,
            interestRate: interest,
            duration: durationDays,
            status: LoanStatus.PENDING,
            dueDate: 0
        });
        
        borrowerLoans[msg.sender].push(newLoan);
        allLoans.push(newLoan);
        emit LoanCreated(msg.sender, allLoans.length - 1);
    }

    function approveLoan(uint256 loanId) external payable {
        Loan storage loan = allLoans[loanId];
        require(loan.status == LoanStatus.PENDING, "Loan not pending");
        require(msg.value >= loan.amount, "Insufficient funds");
        
        loan.status = LoanStatus.APPROVED;
        loan.dueDate = block.timestamp + (loan.duration * 1 days);
        payable(loan.borrower).transfer(loan.amount);
        emit LoanApproved(loanId, msg.sender);
    }
}