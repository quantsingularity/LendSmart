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
        address lender;
        uint256 repaidAmount;
    }

    mapping(address => Loan[]) public borrowerLoans;
    mapping(address => Loan[]) public lenderLoans;
    Loan[] public allLoans;

    event LoanCreated(address indexed borrower, uint256 loanId, uint256 amount, uint256 interestRate, uint256 duration);
    event LoanApproved(uint256 indexed loanId, address indexed lender, address indexed borrower, uint256 amount);
    event LoanRepaid(uint256 indexed loanId, address indexed borrower, address indexed lender, uint256 amount);
    event LoanDefaulted(uint256 indexed loanId, address indexed borrower, address indexed lender);

    function createLoan(uint256 amount, uint256 interest, uint256 durationDays) external {
        require(amount > 0, "Loan amount must be greater than 0");
        require(interest > 0, "Interest rate must be greater than 0");
        require(durationDays > 0, "Duration must be greater than 0");

        Loan memory newLoan = Loan({
            borrower: msg.sender,
            amount: amount,
            interestRate: interest,
            duration: durationDays,
            status: LoanStatus.PENDING,
            dueDate: 0,
            lender: address(0),
            repaidAmount: 0
        });

        borrowerLoans[msg.sender].push(newLoan);
        allLoans.push(newLoan);

        emit LoanCreated(msg.sender, allLoans.length - 1, amount, interest, durationDays);
    }

    function approveLoan(uint256 loanId) external payable {
        require(loanId < allLoans.length, "Invalid loan ID");

        Loan storage loan = allLoans[loanId];
        require(loan.status == LoanStatus.PENDING, "Loan not pending");
        require(msg.value >= loan.amount, "Insufficient funds");
        require(loan.borrower != msg.sender, "Cannot fund your own loan");

        loan.status = LoanStatus.APPROVED;
        loan.dueDate = block.timestamp + (loan.duration * 1 days);
        loan.lender = msg.sender;

        // Add to lender's loans
        lenderLoans[msg.sender].push(loan);

        // Transfer funds to borrower
        payable(loan.borrower).transfer(loan.amount);

        emit LoanApproved(loanId, msg.sender, loan.borrower, loan.amount);
    }

    function repayLoan(uint256 loanId) external payable {
        require(loanId < allLoans.length, "Invalid loan ID");

        Loan storage loan = allLoans[loanId];
        require(loan.status == LoanStatus.APPROVED, "Loan not approved");
        require(loan.borrower == msg.sender, "Only borrower can repay");

        uint256 totalOwed = loan.amount + ((loan.amount * loan.interestRate) / 100);
        uint256 remainingOwed = totalOwed - loan.repaidAmount;

        require(msg.value > 0, "Payment must be greater than 0");

        if (msg.value >= remainingOwed) {
            // Full repayment
            loan.status = LoanStatus.REPAID;
            loan.repaidAmount = totalOwed;

            // Transfer full payment to lender
            payable(loan.lender).transfer(remainingOwed);

            // Return excess funds if any
            if (msg.value > remainingOwed) {
                payable(msg.sender).transfer(msg.value - remainingOwed);
            }

            emit LoanRepaid(loanId, msg.sender, loan.lender, remainingOwed);
        } else {
            // Partial repayment
            loan.repaidAmount += msg.value;

            // Transfer partial payment to lender
            payable(loan.lender).transfer(msg.value);

            emit LoanRepaid(loanId, msg.sender, loan.lender, msg.value);
        }
    }

    function checkLoanDefault(uint256 loanId) external {
        require(loanId < allLoans.length, "Invalid loan ID");

        Loan storage loan = allLoans[loanId];
        require(loan.status == LoanStatus.APPROVED, "Loan not approved");
        require(block.timestamp > loan.dueDate, "Loan not yet due");

        loan.status = LoanStatus.DEFAULTED;

        emit LoanDefaulted(loanId, loan.borrower, loan.lender);
    }

    function getAllLoans() external view returns (Loan[] memory) {
        return allLoans;
    }

    function getBorrowerLoans(address borrower) external view returns (Loan[] memory) {
        return borrowerLoans[borrower];
    }

    function getLenderLoans(address lender) external view returns (Loan[] memory) {
        return lenderLoans[lender];
    }

    function borrowerLoansCount(address borrower) external view returns (uint256) {
        return borrowerLoans[borrower].length;
    }

    function lenderLoansCount(address lender) external view returns (uint256) {
        return lenderLoans[lender].length;
    }
}
