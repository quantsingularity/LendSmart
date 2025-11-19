import React, { useState } from "react";
// import { useNavigate, Link } from "react-router-dom";
// import AuthContext from "../contexts/AuthContext"; // Example
// import apiService from "../services/apiService"; // Example

const RegisterPage = () => {
  // const navigate = useNavigate();
  // const { login } = useContext(AuthContext); // Example, to auto-login after registration
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("borrower"); // Default role
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setError("");
    setLoading(true);
    // try {
    //   const registrationData = { username, email, password, role };
    //   const userData = await apiService.register(registrationData);
    //   // Optionally login the user immediately
    //   // login(userData);
    //   // navigate("/dashboard"); // or to a "please verify your email" page
    //   alert("Registration successful! Please login.");
    //   navigate("/login");
    // } catch (err) {
    //   setError(err.response?.data?.message || "Failed to register. Please try again.");
    // }
    setTimeout(() => { // Simulate API call
        console.log("Registration submitted (simulated):", { username, email, password, role });
        if (email === "existing@example.com") {
            setError("Email already registered (simulated).")
        } else {
            // alert("Registration successful! Please login. (Simulated)");
            // navigate("/login");
            console.log("Simulated registration success")
        }
        setLoading(false);
    }, 1000);
  };

  return (
    <div className="page-container auth-form">
      <h2>Create Your LendSmart Account</h2>
      <form onSubmit={handleSubmit}>
        {error && <p className="error-message">{error}</p>}
        <div>
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="email">Email Address</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength="6"
            required
          />
        </div>
        <div>
          <label htmlFor="confirmPassword">Confirm Password</label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="role">I am a:</label>
          <select id="role" value={role} onChange={(e) => setRole(e.target.value)} required>
            <option value="borrower">Borrower</option>
            <option value="lender">Lender</option>
          </select>
        </div>
        <button type="submit" className="button button-primary" disabled={loading}>
          {loading ? "Registering..." : "Register"}
        </button>
      </form>
      <p className="auth-switch">
        Already have an account? <a href="/login">Login here</a> {/* Use Link from react-router-dom if SPA navigation is preferred */}
      </p>
      <style jsx>{`
        .auth-form {
          max-width: 450px;
          margin: 40px auto;
          padding: 25px;
          border: 1px solid #ddd;
          border-radius: 8px;
          background-color: #fff;
          box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
        .auth-form h2 {
          text-align: center;
          margin-bottom: 25px;
          color: #333;
        }
        .error-message {
          color: red;
          background-color: #ffebee;
          padding: 10px;
          border-radius: 4px;
          margin-bottom: 15px;
          text-align: center;
        }
        .auth-switch {
            text-align: center;
            margin-top: 20px;
        }
      `}</style>
    </div>
  );
};

export default RegisterPage;
