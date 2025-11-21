import React from "react";
import { Link } from "react-router-dom";

const HomePage = () => {
  return (
    <div className="page-container">
      <h1>Welcome to LendSmart</h1>
      <p>
        Your trusted platform for peer-to-peer lending. Connect with borrowers
        and lenders seamlessly and securely.
      </p>
      <div className="cta-buttons">
        <Link to="/register" className="button button-primary">
          Get Started as a Borrower
        </Link>
        <Link to="/loans" className="button button-secondary">
          Explore Loan Marketplace
        </Link>
      </div>

      <section className="features">
        <h2>Platform Features</h2>
        <div className="feature-list">
          <div className="feature-item">
            <h3>Secure Transactions</h3>
            <p>State-of-the-art security for all your financial activities.</p>
          </div>
          <div className="feature-item">
            <h3>Transparent Process</h3>
            <p>Clear terms and conditions with no hidden fees.</p>
          </div>
          <div className="feature-item">
            <h3>Diverse Loan Options</h3>
            <p>Find loans that fit your needs or investment goals.</p>
          </div>
        </div>
      </section>

      <style jsx>{`
        .page-container {
          padding: 20px;
          text-align: center;
        }
        .cta-buttons {
          margin: 30px 0;
        }
        .button {
          padding: 10px 20px;
          margin: 0 10px;
          text-decoration: none;
          border-radius: 5px;
          font-weight: bold;
        }
        .button-primary {
          background-color: #007bff;
          color: white;
        }
        .button-secondary {
          background-color: #6c757d;
          color: white;
        }
        .features {
          margin-top: 40px;
        }
        .feature-list {
          display: flex;
          justify-content: space-around;
          flex-wrap: wrap;
          gap: 20px;
          margin-top: 20px;
        }
        .feature-item {
          flex-basis: calc(33.333% - 20px);
          padding: 20px;
          border: 1px solid #eee;
          border-radius: 8px;
          background-color: #fff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .feature-item h3 {
          color: #007bff;
        }
        @media (max-width: 768px) {
          .feature-item {
            flex-basis: calc(50% - 20px);
          }
        }
        @media (max-width: 480px) {
          .feature-item {
            flex-basis: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default HomePage;
