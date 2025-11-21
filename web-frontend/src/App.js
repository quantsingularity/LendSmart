import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

// Context Providers
import { BlockchainProvider } from "./contexts/BlockchainContext";
import { ApiProvider } from "./contexts/ApiContext";

// Layout Components
import Layout from "./components/layout/Layout";
import PrivateRoute from "./components/routing/PrivateRoute";

// Pages
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import LoanMarketplace from "./pages/LoanMarketplace";
import LoanDetails from "./pages/LoanDetails";
import ApplyForLoan from "./pages/ApplyForLoan";
import MyLoans from "./pages/MyLoans";
import RiskAssessment from "./pages/RiskAssessment";
import NotFound from "./pages/NotFound";

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
      <BlockchainProvider>
        <ApiProvider>
          <Router>
            <Layout>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
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
                <Route path="/marketplace" element={<LoanMarketplace />} />
                <Route path="/loans/:id" element={<LoanDetails />} />
                <Route
                  path="/apply"
                  element={
                    <PrivateRoute>
                      <ApplyForLoan />
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
                <Route path="/404" element={<NotFound />} />
                <Route path="*" element={<Navigate to="/404" replace />} />
              </Routes>
            </Layout>
          </Router>
        </ApiProvider>
      </BlockchainProvider>
    </ThemeProvider>
  );
}

export default App;
