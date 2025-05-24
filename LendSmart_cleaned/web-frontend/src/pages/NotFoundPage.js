import React from "react";
import { Link } from "react-router-dom";

const NotFoundPage = () => {
  return (
    <div className="page-container not-found-page">
      <h1>404</h1>
      <h2>Oops! Page Not Found.</h2>
      <p>The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.</p>
      <Link to="/" className="button button-primary">Go to Homepage</Link>
      <style jsx>{`
        .not-found-page {
          text-align: center;
          padding: 40px 20px;
          min-height: 60vh; /* Ensure it takes up significant screen space */
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }
        .not-found-page h1 {
          font-size: 6rem; /* Larger font size for 404 */
          color: #dc3545; /* A distinct error color */
          margin-bottom: 0;
        }
        .not-found-page h2 {
          font-size: 2rem;
          color: #333;
          margin-top: 10px;
          margin-bottom: 20px;
        }
        .not-found-page p {
          font-size: 1.1rem;
          color: #555;
          margin-bottom: 30px;
          max-width: 500px;
        }
      `}</style>
    </div>
  );
};

export default NotFoundPage;

