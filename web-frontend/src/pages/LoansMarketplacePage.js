import React, { useState, useEffect, useContext } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import apiService from "../services/apiService";
import { AuthContext } from "../contexts/AuthContext";
import { toast } from "react-toastify";

const LoanCard = ({ loan, currentUser, onFundClick }) => {
  // Calculate funding progress percentage
  const fundingProgress = loan.amountFunded
    ? Math.round((loan.amountFunded / loan.amountRequested) * 100)
    : 0;

  // Calculate time remaining for active loans
  const calculateTimeRemaining = () => {
    if (!loan.fundingDate || !loan.term || !loan.termUnit) return null;

    const fundingDate = new Date(loan.fundingDate);
    let maturityDate;

    switch (loan.termUnit.toLowerCase()) {
      case "days":
        maturityDate = new Date(fundingDate);
        maturityDate.setDate(maturityDate.getDate() + loan.term);
        break;
      case "weeks":
        maturityDate = new Date(fundingDate);
        maturityDate.setDate(maturityDate.getDate() + loan.term * 7);
        break;
      case "months":
        maturityDate = new Date(fundingDate);
        maturityDate.setMonth(maturityDate.getMonth() + loan.term);
        break;
      case "years":
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
      return `${months} month${months > 1 ? "s" : ""}`;
    }

    const years = Math.floor(diffDays / 365);
    return `${years} year${years > 1 ? "s" : ""}`;
  };

  // Calculate expected return
  const calculateExpectedReturn = () => {
    if (!loan.amountRequested || !loan.interestRate || !loan.term) return null;

    let termInYears;
    switch (loan.termUnit.toLowerCase()) {
      case "days":
        termInYears = loan.term / 365;
        break;
      case "weeks":
        termInYears = loan.term / 52;
        break;
      case "months":
        termInYears = loan.term / 12;
        break;
      case "years":
        termInYears = loan.term;
        break;
      default:
        return null;
    }

    // Simple interest calculation
    return loan.amountRequested * (loan.interestRate / 100) * termInYears;
  };

  const expectedReturn = calculateExpectedReturn();

  return (
    <div className="loan-card">
      <div className="loan-header">
        <h3>{loan.purpose || "General Loan"}</h3>
        <span
          className={`status status-${loan.status.toLowerCase().replace("_", "-")}`}
        >
          {loan.status.replace("_", " ")}
        </span>
      </div>

      <div className="loan-details">
        <div className="detail-row">
          <span className="detail-label">Amount:</span>
          <span className="detail-value">
            ${loan.amountRequested?.toLocaleString()}
          </span>
        </div>

        <div className="detail-row">
          <span className="detail-label">Interest Rate:</span>
          <span className="detail-value">{loan.interestRate}%</span>
        </div>

        <div className="detail-row">
          <span className="detail-label">Term:</span>
          <span className="detail-value">
            {loan.term} {loan.termUnit}
          </span>
        </div>

        {loan.status === "marketplace" && (
          <div className="detail-row">
            <span className="detail-label">Funding Progress:</span>
            <div className="progress-container">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${fundingProgress}%` }}
                ></div>
              </div>
              <span className="progress-text">{fundingProgress}%</span>
            </div>
          </div>
        )}

        {["funded", "active"].includes(loan.status) && (
          <div className="detail-row">
            <span className="detail-label">Time Remaining:</span>
            <span className="detail-value">{calculateTimeRemaining()}</span>
          </div>
        )}

        {loan.borrower?.creditScore && (
          <div className="detail-row">
            <span className="detail-label">Credit Score:</span>
            <span className="detail-value">{loan.borrower.creditScore}</span>
          </div>
        )}

        {loan.riskLevel && (
          <div className="detail-row">
            <span className="detail-label">Risk Level:</span>
            <span className={`risk-level risk-${loan.riskLevel}`}>
              {loan.riskLevel.charAt(0).toUpperCase() + loan.riskLevel.slice(1)}
            </span>
          </div>
        )}

        {expectedReturn && (
          <div className="detail-row">
            <span className="detail-label">Expected Return:</span>
            <span className="detail-value">
              $
              {expectedReturn.toLocaleString(undefined, {
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
        )}
      </div>

      <div className="loan-actions">
        <Link to={`/loans/${loan._id}`} className="button button-secondary">
          View Details
        </Link>

        {loan.status === "marketplace" &&
          currentUser &&
          currentUser.role === "lender" && (
            <button
              className="button button-primary"
              onClick={() => onFundClick(loan)}
            >
              Fund Loan
            </button>
          )}
      </div>
    </div>
  );
};

const FundingModal = ({ loan, onClose, onSubmit }) => {
  const [fundAmount, setFundAmount] = useState("");
  const [processing, setProcessing] = useState(false);

  const remainingAmount = loan.amountRequested - (loan.amountFunded || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!fundAmount || isNaN(fundAmount) || parseFloat(fundAmount) <= 0) {
      toast.error("Please enter a valid funding amount");
      return;
    }

    const amountToFund = parseFloat(fundAmount);

    if (amountToFund > remainingAmount) {
      toast.error(
        `Maximum funding amount is $${remainingAmount.toLocaleString()}`,
      );
      return;
    }

    setProcessing(true);
    await onSubmit(loan._id, amountToFund);
    setProcessing(false);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Fund This Loan</h3>

        <div className="loan-summary">
          <p>
            <strong>Purpose:</strong> {loan.purpose}
          </p>
          <p>
            <strong>Amount Requested:</strong> $
            {loan.amountRequested.toLocaleString()}
          </p>
          <p>
            <strong>Already Funded:</strong> $
            {(loan.amountFunded || 0).toLocaleString()}
          </p>
          <p>
            <strong>Remaining:</strong> ${remainingAmount.toLocaleString()}
          </p>
          <p>
            <strong>Interest Rate:</strong> {loan.interestRate}%
          </p>
          <p>
            <strong>Term:</strong> {loan.term} {loan.termUnit}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
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
              disabled={processing}
            />
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="button button-secondary"
              onClick={onClose}
              disabled={processing}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="button button-primary"
              disabled={processing}
            >
              {processing ? "Processing..." : "Confirm Funding"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const FilterPanel = ({ filters, setFilters, applyFilters }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleReset = () => {
    setFilters({
      status: [],
      minAmount: "",
      maxAmount: "",
      minInterest: "",
      maxInterest: "",
      term: "",
      purpose: "",
    });
    applyFilters({
      status: [],
      minAmount: "",
      maxAmount: "",
      minInterest: "",
      maxInterest: "",
      term: "",
      purpose: "",
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    applyFilters(filters);
  };

  return (
    <div className="filter-panel">
      <h3>Filter Loans</h3>

      <form onSubmit={handleSubmit}>
        <div className="filter-group">
          <label>Loan Status:</label>
          <div className="checkbox-group">
            <label>
              <input
                type="checkbox"
                name="status"
                value="marketplace"
                checked={filters.status.includes("marketplace")}
                onChange={(e) => {
                  const value = e.target.value;
                  setFilters((prev) => ({
                    ...prev,
                    status: e.target.checked
                      ? [...prev.status, value]
                      : prev.status.filter((s) => s !== value),
                  }));
                }}
              />
              Marketplace
            </label>

            <label>
              <input
                type="checkbox"
                name="status"
                value="funded"
                checked={filters.status.includes("funded")}
                onChange={(e) => {
                  const value = e.target.value;
                  setFilters((prev) => ({
                    ...prev,
                    status: e.target.checked
                      ? [...prev.status, value]
                      : prev.status.filter((s) => s !== value),
                  }));
                }}
              />
              Funded
            </label>

            <label>
              <input
                type="checkbox"
                name="status"
                value="active"
                checked={filters.status.includes("active")}
                onChange={(e) => {
                  const value = e.target.value;
                  setFilters((prev) => ({
                    ...prev,
                    status: e.target.checked
                      ? [...prev.status, value]
                      : prev.status.filter((s) => s !== value),
                  }));
                }}
              />
              Active
            </label>
          </div>
        </div>

        <div className="filter-row">
          <div className="filter-group">
            <label htmlFor="minAmount">Min Amount ($):</label>
            <input
              type="number"
              id="minAmount"
              name="minAmount"
              value={filters.minAmount}
              onChange={handleChange}
              min="0"
              step="100"
            />
          </div>

          <div className="filter-group">
            <label htmlFor="maxAmount">Max Amount ($):</label>
            <input
              type="number"
              id="maxAmount"
              name="maxAmount"
              value={filters.maxAmount}
              onChange={handleChange}
              min="0"
              step="100"
            />
          </div>
        </div>

        <div className="filter-row">
          <div className="filter-group">
            <label htmlFor="minInterest">Min Interest (%):</label>
            <input
              type="number"
              id="minInterest"
              name="minInterest"
              value={filters.minInterest}
              onChange={handleChange}
              min="0"
              step="0.1"
            />
          </div>

          <div className="filter-group">
            <label htmlFor="maxInterest">Max Interest (%):</label>
            <input
              type="number"
              id="maxInterest"
              name="maxInterest"
              value={filters.maxInterest}
              onChange={handleChange}
              min="0"
              step="0.1"
            />
          </div>
        </div>

        <div className="filter-group">
          <label htmlFor="term">Term:</label>
          <select
            id="term"
            name="term"
            value={filters.term}
            onChange={handleChange}
          >
            <option value="">Any</option>
            <option value="short">Short (≤ 6 months)</option>
            <option value="medium">Medium (7-24 months)</option>
            <option value="long">Long (> 24 months)</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="purpose">Purpose:</label>
          <select
            id="purpose"
            name="purpose"
            value={filters.purpose}
            onChange={handleChange}
          >
            <option value="">Any</option>
            <option value="Debt Consolidation">Debt Consolidation</option>
            <option value="Home Improvement">Home Improvement</option>
            <option value="Business">Business</option>
            <option value="Education">Education</option>
            <option value="Medical">Medical</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="filter-actions">
          <button
            type="button"
            className="button button-secondary"
            onClick={handleReset}
          >
            Reset
          </button>
          <button type="submit" className="button button-primary">
            Apply Filters
          </button>
        </div>
      </form>
    </div>
  );
};

const LoansMarketplacePage = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const [loans, setLoans] = useState([]);
  const [filteredLoans, setFilteredLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [showFundingModal, setShowFundingModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    status: ["marketplace"],
    minAmount: "",
    maxAmount: "",
    minInterest: "",
    maxInterest: "",
    term: "",
    purpose: "",
  });
  const [appliedFilters, setAppliedFilters] = useState({
    status: ["marketplace"],
    minAmount: "",
    maxAmount: "",
    minInterest: "",
    maxInterest: "",
    term: "",
    purpose: "",
  });
  const [showFilters, setShowFilters] = useState(false);

  const loansPerPage = 8;

  useEffect(() => {
    // Parse query parameters for filters
    const queryParams = new URLSearchParams(location.search);
    const statusParam = queryParams.get("status");

    if (statusParam) {
      const statusValues = statusParam.split(",");
      setFilters((prev) => ({ ...prev, status: statusValues }));
      setAppliedFilters((prev) => ({ ...prev, status: statusValues }));
    }

    fetchLoans();
  }, [location.search]);

  const fetchLoans = async (page = 1, filterParams = appliedFilters) => {
    setLoading(true);
    setError("");

    try {
      // Prepare filter parameters
      const params = {
        page,
        limit: loansPerPage,
      };

      // Add filters if they exist
      if (filterParams.status && filterParams.status.length > 0) {
        params.status = filterParams.status.join(",");
      }

      if (filterParams.minAmount) params.minAmount = filterParams.minAmount;
      if (filterParams.maxAmount) params.maxAmount = filterParams.maxAmount;
      if (filterParams.minInterest)
        params.minInterest = filterParams.minInterest;
      if (filterParams.maxInterest)
        params.maxInterest = filterParams.maxInterest;

      if (filterParams.term) {
        switch (filterParams.term) {
          case "short":
            params.maxTerm = 6;
            params.termUnit = "months";
            break;
          case "medium":
            params.minTerm = 7;
            params.maxTerm = 24;
            params.termUnit = "months";
            break;
          case "long":
            params.minTerm = 25;
            params.termUnit = "months";
            break;
        }
      }

      if (filterParams.purpose) params.purpose = filterParams.purpose;

      const response = await apiService.getLoans(params);

      setLoans(response.data.loans);
      setFilteredLoans(response.data.loans);
      setTotalPages(response.data.pages);
      setCurrentPage(response.data.page);
    } catch (err) {
      setError("Failed to fetch loans. Please try again later.");
      console.error("Fetch loans error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFundClick = (loan) => {
    if (!user) {
      toast.info("Please log in to fund loans");
      navigate("/login", { state: { from: "/loans" } });
      return;
    }

    if (user.role !== "lender") {
      toast.info("Only lenders can fund loans");
      return;
    }

    setSelectedLoan(loan);
    setShowFundingModal(true);
  };

  const handleFundSubmit = async (loanId, amount) => {
    try {
      const response = await apiService.fundLoan(loanId, { amount });

      toast.success("Loan funded successfully!");
      setShowFundingModal(false);

      // Update the loan in the list
      setLoans((prevLoans) =>
        prevLoans.map((loan) => (loan._id === loanId ? response.data : loan)),
      );

      // If the loan is now fully funded, it might need to be filtered out
      // depending on the current filters
      applyFilters(appliedFilters);
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to fund loan. Please try again.",
      );
      console.error("Fund loan error:", err);
    }
  };

  const applyFilters = (filterParams) => {
    setAppliedFilters(filterParams);
    fetchLoans(1, filterParams);

    // Update URL with filters
    const queryParams = new URLSearchParams();
    if (filterParams.status && filterParams.status.length > 0) {
      queryParams.set("status", filterParams.status.join(","));
    }

    navigate(
      {
        pathname: location.pathname,
        search: queryParams.toString(),
      },
      { replace: true },
    );
  };

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    fetchLoans(page);
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  return (
    <div className="page-container loans-marketplace">
      <div className="marketplace-header">
        <h2>Loan Marketplace</h2>
        <p>
          Browse available loans to invest in or find inspiration for your own
          application.
        </p>

        <div className="header-actions">
          <button
            className="button button-secondary filter-toggle"
            onClick={toggleFilters}
          >
            {showFilters ? "Hide Filters" : "Show Filters"}
          </button>

          {user && user.role === "borrower" && (
            <Link to="/loans/apply" className="button button-primary">
              Apply for a Loan
            </Link>
          )}
        </div>
      </div>

      <div className="marketplace-content">
        {showFilters && (
          <FilterPanel
            filters={filters}
            setFilters={setFilters}
            applyFilters={applyFilters}
          />
        )}

        <div className="loans-container">
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading loans...</p>
            </div>
          ) : error ? (
            <div className="error-message">
              <p>{error}</p>
              <button
                className="button button-primary"
                onClick={() => fetchLoans()}
              >
                Try Again
              </button>
            </div>
          ) : filteredLoans.length === 0 ? (
            <div className="no-loans-message">
              <p>No loans match your current filters.</p>
              <button
                className="button button-secondary"
                onClick={() => {
                  const resetFilters = {
                    status: ["marketplace"],
                    minAmount: "",
                    maxAmount: "",
                    minInterest: "",
                    maxInterest: "",
                    term: "",
                    purpose: "",
                  };
                  setFilters(resetFilters);
                  applyFilters(resetFilters);
                }}
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <>
              <div className="loans-grid">
                {filteredLoans.map((loan) => (
                  <LoanCard
                    key={loan._id}
                    loan={loan}
                    currentUser={user}
                    onFundClick={handleFundClick}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    className="pagination-button"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    &laquo; Previous
                  </button>

                  <span className="pagination-info">
                    Page {currentPage} of {totalPages}
                  </span>

                  <button
                    className="pagination-button"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next &raquo;
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {showFundingModal && selectedLoan && (
        <FundingModal
          loan={selectedLoan}
          onClose={() => {
            setShowFundingModal(false);
            setSelectedLoan(null);
          }}
          onSubmit={handleFundSubmit}
        />
      )}

      <style jsx>{`
        .loans-marketplace {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .marketplace-header {
          text-align: center;
          margin-bottom: 30px;
        }

        .marketplace-header h2 {
          margin-bottom: 10px;
          color: #333;
        }

        .marketplace-header p {
          color: #666;
          margin-bottom: 20px;
        }

        .header-actions {
          display: flex;
          justify-content: center;
          gap: 15px;
          margin-top: 20px;
        }

        .marketplace-content {
          display: flex;
          gap: 20px;
        }

        .filter-panel {
          flex: 0 0 250px;
          background-color: #fff;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
          align-self: flex-start;
          position: sticky;
          top: 20px;
        }

        .filter-panel h3 {
          margin-top: 0;
          margin-bottom: 15px;
          padding-bottom: 10px;
          border-bottom: 1px solid #eee;
          color: #444;
        }

        .filter-group {
          margin-bottom: 15px;
        }

        .filter-group label {
          display: block;
          margin-bottom: 5px;
          font-weight: 500;
          color: #555;
        }

        .filter-group input,
        .filter-group select {
          width: 100%;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }

        .filter-row {
          display: flex;
          gap: 10px;
          margin-bottom: 15px;
        }

        .filter-row .filter-group {
          flex: 1;
          margin-bottom: 0;
        }

        .checkbox-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .checkbox-group label {
          display: flex;
          align-items: center;
          font-weight: normal;
          cursor: pointer;
        }

        .checkbox-group input {
          margin-right: 8px;
          width: auto;
        }

        .filter-actions {
          display: flex;
          justify-content: space-between;
          margin-top: 20px;
        }

        .loans-container {
          flex: 1;
        }

        .loans-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
        }

        .loan-card {
          background-color: #fff;
          border-radius: 8px;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
          overflow: hidden;
          transition:
            transform 0.3s ease,
            box-shadow 0.3s ease;
        }

        .loan-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
        }

        .loan-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px;
          background-color: #f8f9fa;
          border-bottom: 1px solid #eee;
        }

        .loan-header h3 {
          margin: 0;
          font-size: 1.1rem;
          color: #333;
        }

        .loan-details {
          padding: 15px;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
        }

        .detail-label {
          color: #666;
        }

        .detail-value {
          font-weight: 500;
          color: #333;
        }

        .progress-container {
          display: flex;
          align-items: center;
          gap: 10px;
          flex: 1;
        }

        .progress-bar {
          flex: 1;
          height: 8px;
          background-color: #e9ecef;
          border-radius: 4px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background-color: #007bff;
        }

        .progress-text {
          font-size: 0.9rem;
          color: #666;
          min-width: 40px;
          text-align: right;
        }

        .loan-actions {
          display: flex;
          justify-content: space-between;
          padding: 15px;
          border-top: 1px solid #eee;
        }

        .status {
          padding: 5px 10px;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 500;
          text-transform: capitalize;
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

        .risk-level {
          padding: 3px 8px;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 500;
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

        .button {
          padding: 8px 16px;
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

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px;
        }

        .loading-spinner {
          border: 4px solid rgba(0, 0, 0, 0.1);
          border-radius: 50%;
          border-top: 4px solid #007bff;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
          margin-bottom: 20px;
        }

        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        .error-message {
          background-color: #f8d7da;
          color: #721c24;
          padding: 20px;
          border-radius: 8px;
          text-align: center;
        }

        .no-loans-message {
          background-color: #f8f9fa;
          padding: 30px;
          border-radius: 8px;
          text-align: center;
        }

        .pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          margin-top: 30px;
          gap: 15px;
        }

        .pagination-button {
          padding: 8px 16px;
          border: 1px solid #ddd;
          background-color: #fff;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .pagination-button:hover:not(:disabled) {
          background-color: #f8f9fa;
          border-color: #aaa;
        }

        .pagination-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .pagination-info {
          color: #666;
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

        .loan-summary {
          background-color: #f8f9fa;
          padding: 15px;
          border-radius: 4px;
          margin-bottom: 20px;
        }

        .loan-summary p {
          margin: 5px 0;
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

        .form-group input {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 1rem;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
        }

        /* Responsive adjustments */
        @media (max-width: 768px) {
          .marketplace-content {
            flex-direction: column;
          }

          .filter-panel {
            position: static;
            width: 100%;
            margin-bottom: 20px;
          }

          .filter-toggle {
            display: block;
            width: 100%;
            margin-bottom: 15px;
          }

          .header-actions {
            flex-direction: column;
            gap: 10px;
          }

          .header-actions .button {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default LoansMarketplacePage;
