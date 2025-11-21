import React, { Suspense, lazy, useContext } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { AuthContext } from "../contexts/AuthContext";

// Page Components (Lazy Loaded for better performance)
const HomePage = lazy(() => import("../pages/HomePage"));
const LoginPage = lazy(() => import("../pages/LoginPage"));
const RegisterPage = lazy(() => import("../pages/RegisterPage"));
const DashboardPage = lazy(() => import("../pages/DashboardPage"));
const LoansMarketplacePage = lazy(
  () => import("../pages/LoansMarketplacePage"),
);
const LoanDetailsPage = lazy(() => import("../pages/LoanDetailsPage"));
const LoanApplicationPage = lazy(() => import("../pages/LoanApplicationPage"));
const ProfilePage = lazy(() => import("../pages/ProfilePage"));
const NotFoundPage = lazy(() => import("../pages/NotFoundPage"));
const AdminDashboardPage = lazy(() => import("../pages/AdminDashboardPage"));
const WalletConnectionPage = lazy(
  () => import("../pages/WalletConnectionPage"),
);
const TransactionsHistoryPage = lazy(
  () => import("../pages/TransactionsHistoryPage"),
);
const SettingsPage = lazy(() => import("../pages/SettingsPage"));
const KycVerificationPage = lazy(() => import("../pages/KycVerificationPage"));

// Loading component for suspense fallback
const LoadingComponent = () => (
  <div className="loading-container">
    <div className="loading-spinner"></div>
    <p>Loading page...</p>
    <style jsx>{`
      .loading-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 50vh;
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
    `}</style>
  </div>
);

// Protected Route component that checks authentication status
const ProtectedRoute = ({ children, requiredRoles = [] }) => {
  const { user, isAuthenticated, isLoading } = useContext(AuthContext);
  const location = useLocation();

  // Show loading while checking authentication
  if (isLoading) {
    return <LoadingComponent />;
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // If roles are specified and user doesn't have required role
  if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  // If authenticated and has required role, render the children
  return children;
};

const AppRouter = () => {
  return (
    <Router>
      <Navbar />
      <Suspense fallback={<LoadingComponent />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/loans" element={<LoansMarketplacePage />} />
          <Route path="/loans/:id" element={<LoanDetailsPage />} />

          {/* Protected Routes - Any authenticated user */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
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
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/wallet"
            element={
              <ProtectedRoute>
                <WalletConnectionPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/transactions"
            element={
              <ProtectedRoute>
                <TransactionsHistoryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/kyc-verification"
            element={
              <ProtectedRoute>
                <KycVerificationPage />
              </ProtectedRoute>
            }
          />

          {/* Borrower-specific Routes */}
          <Route
            path="/loans/apply"
            element={
              <ProtectedRoute requiredRoles={["borrower"]}>
                <LoanApplicationPage />
              </ProtectedRoute>
            }
          />

          {/* Admin-specific Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRoles={["admin"]}>
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute requiredRoles={["admin"]}>
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Not Found Route */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
      <Footer />
    </Router>
  );
};

export default AppRouter;
