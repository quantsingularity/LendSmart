import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
// import apiService from "../services/apiService"; // Example

const LoanDetailsPage = () => {
  const { id: loanId } = useParams(); // Get loan ID from URL
  const [loan, setLoan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Placeholder data - in a real app, this would be fetched
  const placeholderLoans = [
    { _id: "1", borrower: { username: "borrower1", email: "b1@test.com" }, lender: { username: "lenderX", email: "lX@test.com"}, amount: 5000, interestRate: 5, term: 12, termUnit: "months", status: "marketplace", purpose: "Home Improvement", applicationDate: new Date().toISOString(), collateral: "Car Title" },
    { _id: "2", borrower: { username: "borrower2", email: "b2@test.com" }, lender: { username: "lenderY", email: "lY@test.com"}, amount: 10000, interestRate: 4.5, term: 24, termUnit: "months", status: "funded", purpose: "Car Purchase", applicationDate: new Date().toISOString(), fundedDate: new Date().toISOString(), collateral: "Property" },
    { _id: "3", borrower: { username: "borrower3", email: "b3@test.com" }, amount: 2000, interestRate: 6, term: 6, termUnit: "months", status: "marketplace", purpose: "Debt Consolidation", applicationDate: new Date().toISOString() },
    { _id: "4", borrower: { username: "borrower4", email: "b4@test.com" }, lender: { username: "lenderZ", email: "lZ@test.com"}, amount: 15000, interestRate: 3.9, term: 36, termUnit: "months", status: "active", purpose: "Business Startup", applicationDate: new Date().toISOString(), fundedDate: new Date().toISOString(), maturityDate: new Date(new Date().setFullYear(new Date().getFullYear() + 3)).toISOString() },
  ];

  useEffect(() => {
    const fetchLoanDetails = async () => {
      setLoading(true);
      setError("");
      // try {
      //   // const response = await apiService.getLoanById(loanId);
      //   // setLoan(response.data);
      //   const foundLoan = placeholderLoans.find(l => l._id === loanId);
      //   if (foundLoan) {
      //       setLoan(foundLoan);
      //   } else {
      //       setError("Loan not found.");
      //   }
      // } catch (err) {
      //   setError("Failed to fetch loan details. Please try again later.");
      //   console.error("Fetch loan details error:", err);
      // }
      setTimeout(() => { // Simulate API call
        const foundLoan = placeholderLoans.find(l => l._id === loanId);
        if (foundLoan) {
            setLoan(foundLoan);
        } else {
            setError("Loan not found (simulated).");
        }
        setLoading(false);
      }, 500);
    };

    if (loanId) {
      fetchLoanDetails();
    }
  }, [loanId]);

  if (loading) return <div className="page-container"><p>Loading loan details...</p></div>;
  if (error) return <div className="page-container error-message"><p>{error}</p></div>;
  if (!loan) return <div className="page-container"><p>Loan details not available.</p></div>;

  return (
    <div className="page-container loan-details">
      <h2>Loan Details: {loan.purpose || "N/A"}</h2>
      
      <div className="details-grid">
        <div className="detail-item"><strong>Loan ID:</strong> {loan._id}</div>
        <div className="detail-item"><strong>Amount:</strong> ${loan.amount.toLocaleString()}</div>
        <div className="detail-item"><strong>Interest Rate:</strong> {loan.interestRate}%</div>
        <div className="detail-item"><strong>Term:</strong> {loan.term} {loan.termUnit}</div>
        <div className="detail-item"><strong>Status:</strong> <span className={`status status-${loan.status.toLowerCase().replace("_", "-")}`}>{loan.status.replace("_", " ")}</span></div>
        <div className="detail-item"><strong>Purpose:</strong> {loan.purpose}</div>
        {loan.collateral && <div className="detail-item"><strong>Collateral:</strong> {loan.collateral}</div>}
        <div className="detail-item"><strong>Application Date:</strong> {new Date(loan.applicationDate).toLocaleDateString()}</div>
        {loan.fundedDate && <div className="detail-item"><strong>Funded Date:</strong> {new Date(loan.fundedDate).toLocaleDateString()}</div>}
        {loan.maturityDate && <div className="detail-item"><strong>Maturity Date:</strong> {new Date(loan.maturityDate).toLocaleDateString()}</div>}
        
        <div className="detail-item full-width">
            <strong>Borrower:</strong> {loan.borrower?.username} ({loan.borrower?.email})
        </div>
        {loan.lender && (
            <div className="detail-item full-width">
                <strong>Lender:</strong> {loan.lender?.username} ({loan.lender?.email})
            </div>
        )}
      </div>

      {loan.status === "marketplace" && (
        <div className="actions">
          {/* Add logic for user role (e.g., if current user is a lender) */}
          <button className="button button-primary">Fund This Loan (Placeholder)</button>
        </div>
      )}

      <Link to="/loans" className="button button-secondary" style={{marginTop: "20px"}}>Back to Marketplace</Link>

      <style jsx>{`
        .loan-details {
          padding: 20px;
        }
        .loan-details h2 {
          text-align: center;
          margin-bottom: 30px;
          color: #333;
        }
        .details-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 15px;
          background-color: #fff;
          padding: 25px;
          border-radius: 8px;
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
          margin-bottom: 20px;
        }
        .detail-item {
          padding: 10px;
          border-bottom: 1px solid #eee;
        }
        .detail-item.full-width {
            grid-column: 1 / -1; /* Span across all columns */
        }
        .detail-item strong {
          color: #555;
        }
        .status {
          padding: 3px 8px;
          border-radius: 4px;
          color: white;
          font-size: 0.9em;
          text-transform: capitalize;
        }
        .status-marketplace { background-color: #28a745; }
        .status-pending-approval { background-color: #ffc107; color: #333;}
        .status-funded { background-color: #17a2b8; }
        .status-active { background-color: #007bff; }
        .actions {
          text-align: center;
          margin-top: 30px;
        }
        .error-message {
          color: red;
          background-color: #ffebee;
          padding: 10px;
          border-radius: 4px;
          text-align: center;
        }
      `}</style>
    </div>
  );
};

export default LoanDetailsPage;

