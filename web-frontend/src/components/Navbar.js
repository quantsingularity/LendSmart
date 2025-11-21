import React from "react";
import { Link } from "react-router-dom";
// import AuthContext from "../contexts/AuthContext"; // Example for using auth context

const Navbar = () => {
  // const { user, logout } = useContext(AuthContext); // Example
  const isAuthenticated = false; // Placeholder

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        LendSmart
      </Link>
      <ul className="navbar-nav">
        <li className="nav-item">
          <Link to="/loans" className="nav-link">
            Marketplace
          </Link>
        </li>
        {isAuthenticated ? (
          <>
            <li className="nav-item">
              <Link to="/dashboard" className="nav-link">
                Dashboard
              </Link>
            </li>
            <li className="nav-item">
              {/* <button onClick={logout} className="nav-link btn-link">Logout</button> */}
              <Link to="/login" className="nav-link">
                Logout (Placeholder)
              </Link>
            </li>
          </>
        ) : (
          <>
            <li className="nav-item">
              <Link to="/login" className="nav-link">
                Login
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/register" className="nav-link">
                Sign Up
              </Link>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
};

export default Navbar;
