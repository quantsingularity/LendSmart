import CssBaseline from "@mui/material/CssBaseline";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import {
  Navigate,
  Route,
  BrowserRouter as Router,
  Routes,
} from "react-router-dom";
// Layout Components
import Layout from "./components/layout/Layout";
import PrivateRoute from "./components/routing/PrivateRoute";
import { ApiProvider } from "./contexts/ApiContext";
// Context Providers
import { AuthProvider } from "./contexts/AuthContext";
import { BlockchainProvider } from "./contexts/BlockchainContext";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import ApplyForLoan from "./pages/ApplyForLoan";
import Dashboard from "./pages/Dashboard";
// Pages
import HomePage from "./pages/HomePage";
import KycVerificationPage from "./pages/KycVerificationPage";
// New Pages
import LoanApplicationPage from "./pages/LoanApplicationPage";
import LoanDetails from "./pages/LoanDetails";
import LoanMarketplace from "./pages/LoanMarketplace";
import Login from "./pages/Login";
import MyLoans from "./pages/MyLoans";
import NotFoundPage from "./pages/NotFoundPage";
import Profile from "./pages/Profile";
import ProfilePage from "./pages/ProfilePage";
import Register from "./pages/Register";
import RiskAssessment from "./pages/RiskAssessment";
import SettingsPage from "./pages/SettingsPage";
import TransactionsHistoryPage from "./pages/TransactionsHistoryPage";
import WalletConnectionPage from "./pages/WalletConnectionPage";

// Create theme
const theme = createTheme({
  palette: {
    primary: {
      main: "#1976d2",
    },
    secondary: {
      main: "#f50057",
    },
    background: {
      default: "#f5f5f5",
    },
  },
  typography: {
    fontFamily: ["Roboto", "Arial", "sans-serif"].join(","),
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <BlockchainProvider>
          <ApiProvider>
            <Router>
              <Layout>
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<HomePage />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/marketplace" element={<LoanMarketplace />} />
                  <Route path="/loans/:id" element={<LoanDetails />} />

                  {/* Protected Routes */}
                  <Route
                    path="/dashboard"
                    element={
                      <PrivateRoute>
                        <Dashboard />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/profile"
                    element={
                      <PrivateRoute>
                        <Profile />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/profile-page"
                    element={
                      <PrivateRoute>
                        <ProfilePage />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/apply"
                    element={
                      <PrivateRoute>
                        <ApplyForLoan />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/loans/apply"
                    element={
                      <PrivateRoute>
                        <LoanApplicationPage />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/my-loans"
                    element={
                      <PrivateRoute>
                        <MyLoans />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/risk-assessment"
                    element={
                      <PrivateRoute>
                        <RiskAssessment />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/wallet"
                    element={
                      <PrivateRoute>
                        <WalletConnectionPage />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/transactions"
                    element={
                      <PrivateRoute>
                        <TransactionsHistoryPage />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/settings"
                    element={
                      <PrivateRoute>
                        <SettingsPage />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/kyc-verification"
                    element={
                      <PrivateRoute>
                        <KycVerificationPage />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/admin"
                    element={
                      <PrivateRoute>
                        <AdminDashboardPage />
                      </PrivateRoute>
                    }
                  />

                  {/* Error Pages */}
                  <Route path="/404" element={<NotFoundPage />} />
                  <Route path="*" element={<Navigate to="/404" replace />} />
                </Routes>
              </Layout>
            </Router>
          </ApiProvider>
        </BlockchainProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
