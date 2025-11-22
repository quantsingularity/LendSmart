import React, { useState } from 'react';
// import { useNavigate, Link } from "react-router-dom";
// import AuthContext from "../contexts/AuthContext"; // Example
// import apiService from "../services/apiService"; // Example

const LoginPage = () => {
    // const navigate = useNavigate();
    // const { login } = useContext(AuthContext); // Example
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        // try {
        //   const userData = await apiService.login({ email, password });
        //   login(userData); // Update auth context
        //   navigate("/dashboard");
        // } catch (err) {
        //   setError(err.response?.data?.message || "Failed to login. Please check your credentials.");
        // }
        setTimeout(() => {
            // Simulate API call
            if (email === 'test@example.com' && password === 'password') {
                console.log('Login successful (simulated)');
                // navigate("/dashboard");
            } else {
                setError('Invalid email or password (simulated).');
            }
            setLoading(false);
        }, 1000);
    };

    return (
        <div className="page-container auth-form">
            <h2>Login to LendSmart</h2>
            <form onSubmit={handleSubmit}>
                {error && <p className="error-message">{error}</p>}
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
                        required
                    />
                </div>
                <button type="submit" className="button button-primary" disabled={loading}>
                    {loading ? 'Logging in...' : 'Login'}
                </button>
            </form>
            <p className="auth-switch">
                Don\'t have an account? <a href="/register">Register here</a>{' '}
                {/* Use Link from react-router-dom if SPA navigation is preferred */}
            </p>
            <style jsx>{`
                .auth-form {
                    max-width: 400px;
                    margin: 40px auto;
                    padding: 20px;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    background-color: #fff;
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                }
                .auth-form h2 {
                    text-align: center;
                    margin-bottom: 20px;
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

export default LoginPage;
