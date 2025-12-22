// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/security/ReentrancyGuard.sol';
import '@openzeppelin/contracts/access/Ownable.sol';

/**
 * @title LoanManager
 * @dev Manages the lifecycle of peer-to-peer loans including creation, approval, repayment, and default.
 */
contract LoanManager is ReentrancyGuard, Ownable {
    enum LoanStatus {
        PENDING,
        APPROVED,
        REPAID,
        DEFAULTED,
        CANCELLED
    }

    struct Loan {
        uint256 id;
        address borrower;
        uint256 amount;
        uint256 interestRate; // Percentage, e.g., 5 for 5%
        uint256 duration; // In days
        LoanStatus status;
        uint256 dueDate;
        address lender;
        uint256 repaidAmount;
        uint256 createdAt;
    }

    Loan[] public allLoans;
    mapping(address => uint256[]) public borrowerLoanIds;
    mapping(address => uint256[]) public lenderLoanIds;

    event LoanCreated(
        uint256 indexed loanId,
        address indexed borrower,
        uint256 amount,
        uint256 interestRate,
        uint256 duration
    );
    event LoanApproved(
        uint256 indexed loanId,
        address indexed lender,
        address indexed borrower,
        uint256 amount
    );
    event LoanRepaid(
        uint256 indexed loanId,
        address indexed borrower,
        address indexed lender,
        uint256 amount,
        bool fullyRepaid
    );
    event LoanDefaulted(uint256 indexed loanId, address indexed borrower, address indexed lender);
    event LoanCancelled(uint256 indexed loanId, address indexed borrower);

    constructor() Ownable() {}

    /**
     * @dev Creates a new loan request.
     */
    function createLoan(uint256 amount, uint256 interest, uint256 durationDays) external {
        require(amount > 0, 'Loan amount must be greater than 0');
        require(interest > 0, 'Interest rate must be greater than 0');
        require(durationDays > 0, 'Duration must be greater than 0');

        uint256 loanId = allLoans.length;
        Loan memory newLoan = Loan({
            id: loanId,
            borrower: msg.sender,
            amount: amount,
            interestRate: interest,
            duration: durationDays,
            status: LoanStatus.PENDING,
            dueDate: 0,
            lender: address(0),
            repaidAmount: 0,
            createdAt: block.timestamp
        });

        allLoans.push(newLoan);
        borrowerLoanIds[msg.sender].push(loanId);

        emit LoanCreated(loanId, msg.sender, amount, interest, durationDays);
    }

    /**
     * @dev Cancels a pending loan request.
     */
    function cancelLoan(uint256 loanId) external {
        require(loanId < allLoans.length, 'Invalid loan ID');
        Loan storage loan = allLoans[loanId];
        require(loan.borrower == msg.sender, 'Only borrower can cancel');
        require(loan.status == LoanStatus.PENDING, 'Loan not pending');

        loan.status = LoanStatus.CANCELLED;
        emit LoanCancelled(loanId, msg.sender);
    }

    /**
     * @dev Approves and funds a loan request.
     */
    function approveLoan(uint256 loanId) external payable nonReentrant {
        require(loanId < allLoans.length, 'Invalid loan ID');

        Loan storage loan = allLoans[loanId];
        require(loan.status == LoanStatus.PENDING, 'Loan not pending');
        require(msg.value == loan.amount, 'Must fund exact loan amount');
        require(loan.borrower != msg.sender, 'Cannot fund your own loan');

        loan.status = LoanStatus.APPROVED;
        loan.dueDate = block.timestamp + (loan.duration * 1 days);
        loan.lender = msg.sender;

        lenderLoanIds[msg.sender].push(loanId);

        // Transfer funds to borrower
        (bool success, ) = payable(loan.borrower).call{value: loan.amount}('');
        require(success, 'Transfer to borrower failed');

        emit LoanApproved(loanId, msg.sender, loan.borrower, loan.amount);
    }

    /**
     * @dev Repays a loan (partial or full).
     */
    function repayLoan(uint256 loanId) external payable nonReentrant {
        require(loanId < allLoans.length, 'Invalid loan ID');

        Loan storage loan = allLoans[loanId];
        require(loan.status == LoanStatus.APPROVED, 'Loan not approved or already closed');
        require(loan.borrower == msg.sender, 'Only borrower can repay');
        require(msg.value > 0, 'Payment must be greater than 0');

        uint256 totalOwed = loan.amount + ((loan.amount * loan.interestRate) / 100);
        uint256 remainingOwed = totalOwed - loan.repaidAmount;

        uint256 paymentAmount = msg.value;
        uint256 refundAmount = 0;

        if (paymentAmount >= remainingOwed) {
            refundAmount = paymentAmount - remainingOwed;
            paymentAmount = remainingOwed;
            loan.status = LoanStatus.REPAID;
            loan.repaidAmount = totalOwed;
        } else {
            loan.repaidAmount += paymentAmount;
        }

        // Transfer payment to lender
        (bool success, ) = payable(loan.lender).call{value: paymentAmount}('');
        require(success, 'Transfer to lender failed');

        // Refund excess
        if (refundAmount > 0) {
            (bool refundSuccess, ) = payable(msg.sender).call{value: refundAmount}('');
            require(refundSuccess, 'Refund failed');
        }

        emit LoanRepaid(
            loanId,
            msg.sender,
            loan.lender,
            paymentAmount,
            loan.status == LoanStatus.REPAID
        );
    }

    /**
     * @dev Marks a loan as defaulted if past due date.
     */
    function checkLoanDefault(uint256 loanId) external {
        require(loanId < allLoans.length, 'Invalid loan ID');

        Loan storage loan = allLoans[loanId];
        require(loan.status == LoanStatus.APPROVED, 'Loan not active');
        require(block.timestamp > loan.dueDate, 'Loan not yet due');

        loan.status = LoanStatus.DEFAULTED;

        emit LoanDefaulted(loanId, loan.borrower, loan.lender);
    }

    /**
     * @dev Returns all loans.
     */
    function getAllLoans() external view returns (Loan[] memory) {
        return allLoans;
    }

    /**
     * @dev Returns loans for a specific borrower.
     */
    function getBorrowerLoans(address borrower) external view returns (Loan[] memory) {
        uint256[] memory ids = borrowerLoanIds[borrower];
        Loan[] memory loans = new Loan[](ids.length);
        for (uint256 i = 0; i < ids.length; i++) {
            loans[i] = allLoans[ids[i]];
        }
        return loans;
    }

    /**
     * @dev Returns loans for a specific lender.
     */
    function getLenderLoans(address lender) external view returns (Loan[] memory) {
        uint256[] memory ids = lenderLoanIds[lender];
        Loan[] memory loans = new Loan[](ids.length);
        for (uint256 i = 0; i < ids.length; i++) {
            loans[i] = allLoans[ids[i]];
        }
        return loans;
    }

    /**
     * @dev Returns the count of loans for a borrower.
     */
    function borrowerLoansCount(address borrower) external view returns (uint256) {
        return borrowerLoanIds[borrower].length;
    }

    /**
     * @dev Returns the count of loans for a lender.
     */
    function lenderLoansCount(address lender) external view returns (uint256) {
        return lenderLoanIds[lender].length;
    }
}
