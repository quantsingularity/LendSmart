import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
// import apiService from "../services/apiService"; // Example

const LoanCard = ({ loan }) => (
  <div className="loan-card">
    <h3>Loan for: {loan.purpose || "N/A"}</h3>
    <p><strong>Amount:</strong> ${loan.amount.toLocaleString()}</p>
    <p><strong>Interest Rate:</strong> {loan.interestRate}%</p>
    <p><strong>Term:</strong> {loan.term} {loan.termUnit}</p>
    <p><strong>Status:</strong> <span className={`status status-${loan.status.toLowerCase().replace("_", "-")}`}>{loan.status.replace("_", " ")}</span></p>
    {/* <p><strong>Borrower:</strong> {loan.borrower?.username || "Unknown"}</p> */}
    <Link to={`/loans/${loan._id}`} className="button button-secondary">View Details</Link>
    {loan.status === "marketplace" && (
        <button className="button button-primary" style={{marginLeft: "10px"}}>
            Fund Loan (Placeholder)
        </button>
    )}
    <style jsx>{`
      .loan-card {
        border: 1px solid #ddd;
        border-radius: 8px;
        padding: 20px;
        background-color: #fff;
        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        transition: box-shadow 0.3s ease;
      }
      .loan-card:hover {
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
      }
      .loan-card h3 {
        margin-top: 0;
        color: #007bff;
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
      /* Add more status colors as needed */
    `}</style>
  </div>
);

const LoansMarketplacePage = () => {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Placeholder data
  const placeholderLoans = [
    { _id: "1", borrower: { username: "borrower1" }, amount: 5000, interestRate: 5, term: 12, termUnit: "months", status: "marketplace", purpose: "Home Improvement" },
    { _id: "2", borrower: { username: "borrower2" }, amount: 10000, interestRate: 4.5, term: 24, termUnit: "months", status: "funded", purpose: "Car Purchase" },
    { _id: "3", borrower: { username: "borrower3" }, amount: 2000, interestRate: 6, term: 6, termUnit: "months", status: "marketplace", purpose: "Debt Consolidation" },
    { _id: "4", borrower: { username: "borrower4" }, amount: 15000, interestRate: 3.9, term: 36, termUnit: "months", status: "active", purpose: "Business Startup" },
  ];

  useEffect(() => {
    const fetchLoans = async () => {
      setLoading(true);
      setError("");
      // try {
      //   // const response = await apiService.getLoans({ status: "marketplace" }); // Or all loans
      //   // setLoans(response.data);
      //   setLoans(placeholderLoans); // Using placeholder for now
      // } catch (err) {
      //   setError("Failed to fetch loans. Please try again later.");
      //   console.error("Fetch loans error:", err);
      // }
      setTimeout(() => { // Simulate API call
        setLoans(placeholderLoans.filter(loan => loan.status === "marketplace" || loan.status === "funded" || loan.status === "active")); // Show a mix for demo
        setLoading(false);
      }, 500);
    };
    fetchLoans();
  }, []);

  return (
    <div className="page-container loans-marketplace">
      <h2>Loan Marketplace</h2>
      <p>Browse available loans to invest in or find inspiration for your own application.</p>
      <Link to="/loans/apply" className="button button-primary" style={{marginBottom: "20px", display: "inline-block"}}>Apply for a Loan</Link>

      {loading && <p>Loading loans...</p>}
      {error && <p className="error-message">{error}</p>}
      
      {!loading && !error && loans.length === 0 && <p>No loans currently available in the marketplace.</p>}
      
      {!loading && !error && loans.length > 0 && (
        <div className="loans-grid">
          {loans.map(loan => (
            <LoanCard key={loan._id} loan={loan} />
          ))}
        </div>
      )}
      <style jsx>{`
        .loans-marketplace h2 {
          text-align: center;
          margin-bottom: 20px;
        }
        .loans-marketplace > p {
            text-align: center;
            margin-bottom: 20px;
        }
        .loans-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
        }
         .error-message {
          color: red;
          background-color: #ffebee;
          padding: 10px;
          border-radius: 4px;
          margin-bottom: 15px;
          text-align: center;
        }
      `}</style>
    </div>
  );
};

export default LoansMarketplacePage;

