import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link
} from "react-router-dom";
import './App.css';

// Placeholder Pages (to be created in src/pages/)
const HomePage = () => (
  <div>
    <h2>Home Page</h2>
    <p>Welcome to LendSmart! Your peer-to-peer lending solution.</p>
    <nav>
      <ul>
        <li><Link to="/login">Login</Link></li>
        <li><Link to="/register">Register</Link></li>
        <li><Link to="/dashboard">Dashboard (Protected)</Link></li>
        <li><Link to="/loans">View Loans</Link></li>
      </ul>
    </nav>
  </div>
);

const LoginPage = () => <h2>Login Page</h2>;
const RegisterPage = () => <h2>Register Page</h2>;
const DashboardPage = () => <h2>User Dashboard</h2>;
const LoansMarketplacePage = () => <h2>Loans Marketplace</h2>;
const LoanDetailsPage = () => <h2>Loan Details</h2>;
const NotFoundPage = () => <h2>404 - Page Not Found</h2>;

// Placeholder Components (to be created in src/components/)
const Navbar = () => (
  <nav className="navbar">
    <Link to="/">LendSmart</Link>
    <ul>
      <li><Link to="/loans">Marketplace</Link></li>
      <li><Link to="/login">Login</Link></li>
      <li><Link to="/register">Sign Up</Link></li>
      {/* Add more links based on auth state, e.g., Dashboard, Logout */}
    </ul>
  </nav>
);

const Footer = () => (
  <footer className="footer">
    <p>&copy; {new Date().getFullYear()} LendSmart. All rights reserved.</p>
  </footer>
);

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <main className="container">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/dashboard" element={<DashboardPage />} /> {/* Potentially protected route */}
            <Route path="/loans" element={<LoansMarketplacePage />} />
            <Route path="/loans/:id" element={<LoanDetailsPage />} />
            {/* Add more routes for user profile, loan application, admin panel etc. */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;

