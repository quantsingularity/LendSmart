import React, { useState, useEffect, useContext } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import apiService from "../services/apiService";
import blockchainService from "../services/blockchainService";
import { AuthContext } from "../contexts/AuthContext";
import { toast } from "react-toastify";

const LoanDetailsPage = () => {
  const { id: loanId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [loan, setLoan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [fundAmount, setFundAmount] = useState("");
  const [processingAction, setProcessingAction] = useState(false);
  const [repaymentSchedule, setRepaymentSchedule] = useState([]);
  const [transactionHistory, setTransactionHistory] = useState([]);
  const [showFundingModal, setShowFundingModal] = useState(false);
  const [showRepaymentModal, setShowRepaymentModal] = useState(false);
  const [repaymentAmount, setRepaymentAmount] = useState("");
  const [selectedInstallment, setSelectedInstallment] = useState(null);

  useEffect(() => {
    const fetchLoanDetails = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await apiService.getLoanById(loanId);
        setLoan(response.data);

        // Fetch repayment schedule if loan is funded or active
        if (["funded", "active"].includes(response.data.status)) {
          const scheduleResponse = await apiService.getLoanRepaymentSchedule(loanId);
          setRepaymentSchedule(scheduleResponse.data);
        }

        // Fetch blockchain transaction history if available
        if (response.data.smartContractAddress) {
          try {
            const txHistory = await blockchainService.getLoanTransactionHistory(
              response.data.smartContractAddress
            );
            setTransactionHistory(txHistory);
          } catch (txError) {
            console.error("Failed to fetch blockchain transactions:", txError);
          }
        }
      } catch (err) {
        setError("Failed to fetch loan details. Please try again later.");
        console.error("Fetch loan details error:", err);
      } finally {
        setLoading(false);
      }
    };

    if (loanId) {
      fetchLoanDetails();
    }
  }, [loanId]);

  const handleFundLoan = async (e) => {
    e.preventDefault();

    if (!user) {
      toast.error("Please log in to fund this loan");
      navigate("/login", { state: { from: `/loans/${loanId}` } });
      return;
    }

    if (user.role !== "lender") {
      toast.error("Only lenders can fund loans");
      return;
    }

    if (!fundAmount || isNaN(fundAmount) || parseFloat(fundAmount) <= 0) {
      toast.error("Please enter a valid funding amount");
      return;
    }

    const amountToFund = parseFloat(fundAmount);
    const remainingAmount = loan.amountRequested - (loan.amountFunded || 0);

    if (amountToFund > remainingAmount) {
      toast.error(`Maximum funding amount is $${remainingAmount.toLocaleString()}`);
      return;
    }

    setProcessingAction(true);

    try {
      // First check if user has connected wallet
      if (!user.walletAddress) {
        toast.error("Please connect your wallet in your profile settings first");
        setProcessingAction(false);
        return;
      }

      // Prepare blockchain transaction if enabled
      let txHash = null;
      if (blockchainService.isEnabled()) {
        try {
          txHash = await blockchainService.fundLoan(
            loan.smartContractAddress || null,
            loan.borrower.walletAddress,
            user.walletAddress,
            amountToFund
          );
        } catch (blockchainError) {
          console.error("Blockchain transaction failed:", blockchainError);
          toast.error("Blockchain transaction failed. Please try again.");
          setProcessingAction(false);
          return;
        }
      }

      // Submit to API
      const response = await apiService.fundLoan(loanId, {
        amount: amountToFund,
        transactionHash: txHash
      });

      toast.success("Loan funded successfully!");
      setLoan(response.data);
      setShowFundingModal(false);
      setFundAmount("");

      // Refresh repayment schedule
      if (["funded", "active"].includes(response.data.status)) {
        const scheduleResponse = await apiService.getLoanRepaymentSchedule(loanId);
        setRepaymentSchedule(scheduleResponse.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to fund loan. Please try again.");
      console.error("Fund loan error:", err);
    } finally {
      setProcessingAction(false);
    }
  };

  const handleRepayLoan = async (e) => {
    e.preventDefault();

    if (!user) {
      toast.error("Please log in to make a repayment");
      navigate("/login", { state: { from: `/loans/${loanId}` } });
      return;
    }

    if (user.id !== loan.borrower._id) {
      toast.error("Only the borrower can make repayments");
      return;
    }

    if (!selectedInstallment) {
      toast.error("Please select an installment to repay");
      return;
    }

    if (!repaymentAmount || isNaN(repaymentAmount) || parseFloat(repaymentAmount) <= 0) {
      toast.error("Please enter a valid repayment amount");
      return;
    }

    const amountToRepay = parseFloat(repaymentAmount);
    const remainingDue = selectedInstallment.amountDue - (selectedInstallment.amountPaid || 0);

    if (amountToRepay > remainingDue) {
      toast.error(`Maximum repayment amount is $${remainingDue.toLocaleString()}`);
      return;
    }

    setProcessingAction(true);

    try {
      // First check if user has connected wallet
      if (!user.walletAddress) {
        toast.error("Please connect your wallet in your profile settings first");
        setProcessingAction(false);
        return;
      }

      // Prepare blockchain transaction if enabled
      let txHash = null;
      if (blockchainService.isEnabled() && loan.smartContractAddress) {
        try {
          txHash = await blockchainService.repayLoan(
            loan.smartContractAddress,
            user.walletAddress,
            loan.lender.walletAddress,
            amountToRepay,
            selectedInstallment.installmentNumber
          );
        } catch (blockchainError) {
          console.error("Blockchain transaction failed:", blockchainError);
          toast.error("Blockchain transaction failed. Please try again.");
          setProcessingAction(false);
          return;
        }
      }

      // Submit to API
      const response = await apiService.recordRepayment(loanId, {
        installmentNumber: selectedInstallment.installmentNumber,
        amount: amountToRepay,
        transactionHash: txHash
      });

      toast.success("Repayment recorded successfully!");
      setLoan(response.data);
      setShowRepaymentModal(false);
      setRepaymentAmount("");
      setSelectedInstallment(null);

      // Refresh repayment schedule
      const scheduleResponse = await apiService.getLoanRepaymentSchedule(loanId);
      setRepaymentSchedule(scheduleResponse.data);

      // Refresh transaction history if available
      if (loan.smartContractAddress) {
        try {
          const txHistory = await blockchainService.getLoanTransactionHistory(
            loan.smartContractAddress
          );
          setTransactionHistory(txHistory);
        } catch (txError) {
          console.error("Failed to fetch blockchain transactions:", txError);
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to record repayment. Please try again.");
      console.error("Repayment error:", err);
    } finally {
      setProcessingAction(false);
    }
  };

  const calculateRemainingAmount = () => {
    if (!loan) return 0;
    return loan.amountRequested - (loan.amountFunded || 0);
  };

  const calculateTimeRemaining = () => {
    if (!loan || !loan.fundingDate || !loan.term || !loan.termUnit) return null;

    const fundingDate = new Date(loan.fundingDate);
    let maturityDate;

    switch (loan.termUnit.toLowerCase()) {
      case 'days':
        maturityDate = new Date(fundingDate);
        maturityDate.setDate(maturityDate.getDate() + loan.term);
        break;
      case 'weeks':
        maturityDate = new Date(fundingDate);
        maturityDate.setDate(maturityDate.getDate() + (loan.term * 7));
        break;
      case 'months':
        maturityDate = new Date(fundingDate);
        maturityDate.setMonth(maturityDate.getMonth() + loan.term);
        break;
      case 'years':
        maturityDate = new Date(fundingDate);
        maturityDate.setFullYear(maturityDate.getFullYear() + loan.term);
        break;
      default:
        return null;
    }

    const now = new Date();
    const diffTime = maturityDate - now;

    if (diffTime <= 0) return "Matured";

    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 30) return `${diffDays} days`;
    if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} month${months > 1 ? 's' : ''}`;
    }

    const years = Math.floor(diffDays / 365);
    const remainingMonths = Math.floor((diffDays % 365) / 30);

    return `${years} year${years > 1 ? 's' : ''}${remainingMonths > 0 ? `, ${remainingMonths} month${remainingMonths > 1 ? 's' : ''}` : ''}`;
  };

  const renderFundingModal = () => {
    if (!showFundingModal) return null;

    const remainingAmount = calculateRemainingAmount();

    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <h3>Fund This Loan</h3>
          <p>Loan Amount: ${loan.amountRequested.toLocaleString()}</p>
          <p>Already Funded: ${(loan.amountFunded || 0).toLocaleString()}</p>
          <p>Remaining: ${remainingAmount.toLocaleString()}</p>

          <form onSubmit={handleFundLoan}>
            <div className="form-group">
              <label htmlFor="fundAmount">Amount to Fund ($):</label>
              <input
                type="number"
                id="fundAmount"
                value={fundAmount}
                onChange={(e) => setFundAmount(e.target.value)}
                min="1"
                max={remainingAmount}
                step="0.01"
                required
                disabled={processingAction}
              />
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="button button-secondary"
                onClick={() => setShowFundingModal(false)}
                disabled={processingAction}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="button button-primary"
                disabled={processingAction}
              >
                {processingAction ? "Processing..." : "Confirm Funding"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const renderRepaymentModal = () => {
    if (!showRepaymentModal) return null;

    // Filter only unpaid or partially paid installments
    const unpaidInstallments = repaymentSchedule.filter(
      installment => installment.status !== "paid"
    );

    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <h3>Make a Repayment</h3>

          <form onSubmit={handleRepayLoan}>
            <div className="form-group">
              <label htmlFor="installment">Select Installment:</label>
              <select
                id="installment"
                value={selectedInstallment?.installmentNumber || ""}
                onChange={(e) => {
                  const selected = repaymentSchedule.find(
                    i => i.installmentNumber === parseInt(e.target.value)
                  );
                  setSelectedInstallment(selected);

                  // Set default repayment amount to remaining due
                  if (selected) {
                    const remainingDue = selected.amountDue - (selected.amountPaid || 0);
                    setRepaymentAmount(remainingDue.toString());
                  }
                }}
                required
                disabled={processingAction}
              >
                <option value="">-- Select Installment --</option>
                {unpaidInstallments.map(installment => (
                  <option
                    key={installment.installmentNumber}
                    value={installment.installmentNumber}
                  >
                    #{installment.installmentNumber} - Due: {new Date(installment.dueDate).toLocaleDateString()}
                    (${installment.amountDue.toLocaleString()})
                  </option>
                ))}
              </select>
            </div>

            {selectedInstallment && (
              <>
                <div className="installment-details">
                  <p>Due Date: {new Date(selectedInstallment.dueDate).toLocaleDateString()}</p>
                  <p>Amount Due: ${selectedInstallment.amountDue.toLocaleString()}</p>
                  <p>Already Paid: ${(selectedInstallment.amountPaid || 0).toLocaleString()}</p>
                  <p>Remaining: ${(selectedInstallment.amountDue - (selectedInstallment.amountPaid || 0)).toLocaleString()}</p>
                </div>

                <div className="form-group">
                  <label htmlFor="repaymentAmount">Amount to Pay ($):</label>
                  <input
                    type="number"
                    id="repaymentAmount"
                    value={repaymentAmount}
                    onChange={(e) => setRepaymentAmount(e.target.value)}
                    min="1"
                    max={selectedInstallment.amountDue - (selectedInstallment.amountPaid || 0)}
                    step="0.01"
                    required
                    disabled={processingAction}
                  />
                </div>
              </>
            )}

            <div className="modal-actions">
              <button
                type="button"
                className="button button-secondary"
                onClick={() => {
                  setShowRepaymentModal(false);
                  setSelectedInstallment(null);
                  setRepaymentAmount("");
                }}
                disabled={processingAction}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="button button-primary"
                disabled={processingAction || !selectedInstallment}
              >
                {processingAction ? "Processing..." : "Confirm Payment"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  if (loading) return (
    <div className="page-container">
      <div className="loading-spinner"></div>
      <p className="loading-text">Loading loan details...</p>
    </div>
  );

  if (error) return (
    <div className="page-container error-message">
      <p>{error}</p>
      <Link to="/loans" className="button button-secondary">Back to Marketplace</Link>
    </div>
  );

  if (!loan) return (
    <div className="page-container">
      <p>Loan details not available.</p>
      <Link to="/loans" className="button button-secondary">Back to Marketplace</Link>
    </div>
  );

  return (
    <div className="page-container loan-details">
      <h2>Loan Details</h2>

      <div className="loan-header">
        <h3>{loan.purpose || "General Loan"}</h3>
        <div className="loan-status">
          <span className={`status status-${loan.status.toLowerCase().replace("_", "-")}`}>
            {loan.status.replace("_", " ")}
          </span>
        </div>
      </div>

      <div className="loan-summary">
        <div className="summary-item">
          <span className="summary-label">Amount</span>
          <span className="summary-value">${loan.amountRequested?.toLocaleString()}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Interest Rate</span>
          <span className="summary-value">{loan.interestRate}%</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Term</span>
          <span className="summary-value">{loan.term} {loan.termUnit}</span>
        </div>
        {loan.status === "marketplace" && (
          <div className="summary-item">
            <span className="summary-label">Funding Progress</span>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${((loan.amountFunded || 0) / loan.amountRequested) * 100}%` }}
              ></div>
            </div>
            <span className="progress-text">
              ${(loan.amountFunded || 0).toLocaleString()} of ${loan.amountRequested.toLocaleString()}
              ({Math.round(((loan.amountFunded || 0) / loan.amountRequested) * 100)}%)
            </span>
          </div>
        )}
        {["funded", "active", "repaid"].includes(loan.status) && (
          <div className="summary-item">
            <span className="summary-label">Time Remaining</span>
            <span className="summary-value">{calculateTimeRemaining()}</span>
          </div>
        )}
      </div>

      <div className="details-grid">
        <div className="detail-section">
          <h4>Loan Information</h4>
          <div className="detail-item"><strong>Loan ID:</strong> {loan._id}</div>
          <div className="detail-item"><strong>Purpose:</strong> {loan.purpose}</div>
          {loan.collateral && (
            <div className="detail-item"><strong>Collateral:</strong> {loan.collateral}</div>
          )}
          <div className="detail-item">
            <strong>Application Date:</strong> {new Date(loan.applicationDate).toLocaleDateString()}
          </div>
          {loan.fundingDate && (
            <div className="detail-item">
              <strong>Funded Date:</strong> {new Date(loan.fundingDate).toLocaleDateString()}
            </div>
          )}
          {loan.completionDate && (
            <div className="detail-item">
              <strong>Completion Date:</strong> {new Date(loan.completionDate).toLocaleDateString()}
            </div>
          )}
          {loan.smartContractAddress && (
            <div className="detail-item">
              <strong>Smart Contract:</strong>
              <a
                href={`https://etherscan.io/address/${loan.smartContractAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="contract-link"
              >
                {loan.smartContractAddress.substring(0, 8)}...{loan.smartContractAddress.substring(36)}
              </a>
            </div>
          )}
        </div>

        <div className="detail-section">
          <h4>Participants</h4>
          <div className="detail-item">
            <strong>Borrower:</strong> {loan.borrower?.username}
            {user && user.role === "admin" && (
              <span className="admin-info"> ({loan.borrower?.email})</span>
            )}
          </div>
          {loan.lender && (
            <div className="detail-item">
              <strong>Lender:</strong> {loan.lender?.username}
              {user && user.role === "admin" && (
                <span className="admin-info"> ({loan.lender?.email})</span>
              )}
            </div>
          )}
          {loan.borrower?.creditScore && (
            <div className="detail-item">
              <strong>Credit Score:</strong> {loan.borrower.creditScore}
            </div>
          )}
          {loan.riskLevel && (
            <div className="detail-item">
              <strong>Risk Level:</strong>
              <span className={`risk-level risk-${loan.riskLevel}`}>
                {loan.riskLevel.charAt(0).toUpperCase() + loan.riskLevel.slice(1)}
              </span>
            </div>
          )}
        </div>
      </div>

      {repaymentSchedule.length > 0 && (
        <div className="repayment-schedule">
          <h4>Repayment Schedule</h4>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Due Date</th>
                  <th>Amount Due</th>
                  <th>Principal</th>
                  <th>Interest</th>
                  <th>Amount Paid</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {repaymentSchedule.map(installment => (
                  <tr key={installment.installmentNumber}>
                    <td>{installment.installmentNumber}</td>
                    <td>{new Date(installment.dueDate).toLocaleDateString()}</td>
                    <td>${installment.amountDue.toLocaleString()}</td>
                    <td>${installment.principalComponent.toLocaleString()}</td>
                    <td>${installment.interestComponent.toLocaleString()}</td>
                    <td>${(installment.amountPaid || 0).toLocaleString()}</td>
                    <td>
                      <span className={`payment-status status-${installment.status}`}>
                        {installment.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {transactionHistory.length > 0 && (
        <div className="transaction-history">
          <h4>Blockchain Transaction History</h4>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Transaction Hash</th>
                </tr>
              </thead>
              <tbody>
                {transactionHistory.map((tx, index) => (
                  <tr key={index}>
                    <td>{new Date(tx.timestamp).toLocaleString()}</td>
                    <td>{tx.type}</td>
                    <td>${tx.amount.toLocaleString()}</td>
                    <td>
                      <a
                        href={`https://etherscan.io/tx/${tx.hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="tx-link"
                      >
                        {tx.hash.substring(0, 8)}...{tx.hash.substring(62)}
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="actions">
        {loan.status === "marketplace" && user && user.role === "lender" && (
          <button
            className="button button-primary"
            onClick={() => setShowFundingModal(true)}
            disabled={processingAction}
          >
            Fund This Loan
          </button>
        )}

        {["funded", "active"].includes(loan.status) &&
         user && user.id === loan.borrower._id && (
          <button
            className="button button-primary"
            onClick={() => setShowRepaymentModal(true)}
            disabled={processingAction}
          >
            Make a Repayment
          </button>
        )}

        <Link to="/loans" className="button button-secondary">
          Back to Marketplace
        </Link>
      </div>

      {renderFundingModal()}
      {renderRepaymentModal()}

      <style jsx>{`
        .loan-details {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .loan-details h2 {
          text-align: center;
          margin-bottom: 20px;
          color: #333;
        }

        .loan-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .loan-header h3 {
          margin: 0;
          font-size: 1.5rem;
          color: #444;
        }

        .loan-summary {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
          background-color: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 30px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }

        .summary-item {
          display: flex;
          flex-direction: column;
        }

        .summary-label {
          font-size: 0.9rem;
          color: #666;
          margin-bottom: 5px;
        }

        .summary-value {
          font-size: 1.2rem;
          font-weight: 600;
          color: #333;
        }

        .progress-bar {
          height: 10px;
          background-color: #e9ecef;
          border-radius: 5px;
          overflow: hidden;
          margin: 5px 0;
        }

        .progress-fill {
          height: 100%;
          background-color: #007bff;
        }

        .progress-text {
          font-size: 0.9rem;
          color: #666;
        }

        .details-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }

        .detail-section {
          background-color: #fff;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }

        .detail-section h4 {
          margin-top: 0;
          margin-bottom: 15px;
          padding-bottom: 10px;
          border-bottom: 1px solid #eee;
          color: #444;
        }

        .detail-item {
          padding: 8px 0;
          border-bottom: 1px solid #f5f5f5;
        }

        .detail-item:last-child {
          border-bottom: none;
        }

        .detail-item strong {
          color: #555;
          margin-right: 5px;
        }

        .repayment-schedule,
        .transaction-history {
          background-color: #fff;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
          margin-bottom: 30px;
        }

        .repayment-schedule h4,
        .transaction-history h4 {
          margin-top: 0;
          margin-bottom: 15px;
          color: #444;
        }

        .table-container {
          overflow-x: auto;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        th, td {
          padding: 12px 15px;
          text-align: left;
          border-bottom: 1px solid #eee;
        }

        th {
          background-color: #f8f9fa;
          font-weight: 600;
          color: #444;
        }

        tr:hover {
          background-color: #f8f9fa;
        }

        .actions {
          display: flex;
          justify-content: center;
          gap: 15px;
          margin-top: 30px;
        }

        .button {
          padding: 10px 20px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.3s ease;
          text-decoration: none;
          display: inline-block;
        }

        .button-primary {
          background-color: #007bff;
          color: white;
        }

        .button-primary:hover {
          background-color: #0069d9;
        }

        .button-secondary {
          background-color: #6c757d;
          color: white;
        }

        .button-secondary:hover {
          background-color: #5a6268;
        }

        .button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .status {
          padding: 5px 10px;
          border-radius: 4px;
          font-size: 0.85rem;
          font-weight: 500;
          text-transform: capitalize;
          display: inline-block;
        }

        .status-marketplace {
          background-color: #28a745;
          color: white;
        }

        .status-pending {
          background-color: #ffc107;
          color: #212529;
        }

        .status-funded {
          background-color: #17a2b8;
          color: white;
        }

        .status-active {
          background-color: #007bff;
          color: white;
        }

        .status-repaid {
          background-color: #6f42c1;
          color: white;
        }

        .status-defaulted {
          background-color: #dc3545;
          color: white;
        }

        .status-cancelled {
          background-color: #6c757d;
          color: white;
        }

        .payment-status {
          padding: 3px 8px;
          border-radius: 4px;
          font-size: 0.8rem;
          text-transform: capitalize;
        }

        .status-paid {
          background-color: #28a745;
          color: white;
        }

        .status-pending {
          background-color: #ffc107;
          color: #212529;
        }

        .status-partially-paid {
          background-color: #17a2b8;
          color: white;
        }

        .status-overdue {
          background-color: #dc3545;
          color: white;
        }

        .risk-level {
          padding: 3px 8px;
          border-radius: 4px;
          font-size: 0.85rem;
        }

        .risk-low {
          background-color: #28a745;
          color: white;
        }

        .risk-medium {
          background-color: #ffc107;
          color: #212529;
        }

        .risk-high {
          background-color: #dc3545;
          color: white;
        }

        .contract-link,
        .tx-link {
          color: #007bff;
          text-decoration: none;
        }

        .contract-link:hover,
        .tx-link:hover {
          text-decoration: underline;
        }

        .admin-info {
          font-size: 0.85rem;
          color: #6c757d;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }

        .modal-content {
          background-color: white;
          padding: 25px;
          border-radius: 8px;
          width: 90%;
          max-width: 500px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .modal-content h3 {
          margin-top: 0;
          margin-bottom: 20px;
          color: #333;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 500;
          color: #555;
        }

        .form-group input,
        .form-group select {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 1rem;
        }

        .installment-details {
          background-color: #f8f9fa;
          padding: 15px;
          border-radius: 4px;
          margin-bottom: 20px;
        }

        .installment-details p {
          margin: 5px 0;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 20px;
        }

        .loading-spinner {
          border: 4px solid rgba(0, 0, 0, 0.1);
          border-radius: 50%;
          border-top: 4px solid #007bff;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
          margin: 20px auto;
        }

        .loading-text {
          text-align: center;
          color: #666;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .error-message {
          color: #721c24;
          background-color: #f8d7da;
          padding: 15px;
          border-radius: 4px;
          text-align: center;
          margin-bottom: 20px;
        }
      `}</style>
    </div>
  );
};

export default LoanDetailsPage;
