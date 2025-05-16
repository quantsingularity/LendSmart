import React, { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
// import AuthContext from "../contexts/AuthContext"; // Assuming you have this for protected routes

// Page Components (Lazy Loaded for better performance)
const HomePage = lazy(() => import("../pages/HomePage"));
const LoginPage = lazy(() => import("../pages/LoginPage"));
const RegisterPage = lazy(() => import("../pages/RegisterPage"));
const DashboardPage = lazy(() => import("../pages/DashboardPage"));
const LoansMarketplacePage = lazy(() => import("../pages/LoansMarketplacePage"));
const LoanDetailsPage = lazy(() => import("../pages/LoanDetailsPage"));
const NotFoundPage = lazy(() => import("../pages/NotFoundPage"));

// Placeholder for a ProtectedRoute component
// You would typically implement this to check authentication status
const ProtectedRoute = ({ children }) => {
    // const { isAuthenticated } = useContext(AuthContext); // Example using AuthContext
    const isAuthenticated = !!localStorage.getItem("authToken"); // Simple check, replace with context

    if (!isAuthenticated) {
        // Redirect them to the /login page, but save the current location they were
        // trying to go to when they were redirected.
        return <Navigate to="/login" replace />;
    }
    return children;
};

const AppRouter = () => {
    return (
        <Router>
            <Navbar />
            <Suspense fallback={<div style={{ textAlign: 'center', marginTop: '50px' }}>Loading page...</div>}>
                <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<HomePage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/marketplace" element={<LoansMarketplacePage />} />
                    <Route path="/loan/:loanId" element={<LoanDetailsPage />} />

                    {/* Protected Routes */}
                    <Route 
                        path="/dashboard"
                        element={
                            <ProtectedRoute>
                                <DashboardPage />
                            </ProtectedRoute>
                        }
                    />
                    {/* Add other protected routes here, e.g., profile, loan application */}
                    {/* 
                    <Route 
                        path="/apply-loan"
                        element={
                            <ProtectedRoute>
                                <LoanApplicationPage /> 
                            </ProtectedRoute>
                        }
                    /> 
                    <Route 
                        path="/profile"
                        element={
                            <ProtectedRoute>
                                <ProfilePage /> 
                            </ProtectedRoute>
                        }
                    />
                    */}

                    {/* Not Found Route */}
                    <Route path="*" element={<NotFoundPage />} />
                </Routes>
            </Suspense>
            <Footer />
        </Router>
    );
};

export default AppRouter;

