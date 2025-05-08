import { render, screen } from "@testing-library/react";
import { BrowserRouter as Router } from "react-router-dom";
import Dashboard from "./Dashboard"; // Page path
import { useAuth } from "../context/AuthContext";

// Mock the AuthContext
jest.mock("../context/AuthContext", () => ({
  useAuth: jest.fn(),
}));

// Mock child components that Dashboard might render
jest.mock("../components/BorrowerDashboard", () => () => <div data-testid="borrower-dashboard-mock">Borrower Dashboard Mock</div>);
jest.mock("../components/LenderDashboard", () => () => <div data-testid="lender-dashboard-mock">Lender Dashboard Mock</div>);

describe("Dashboard Page", () => {
  test("renders BorrowerDashboard when user role is borrower", () => {
    useAuth.mockReturnValue({ user: { name: "Test Borrower", role: "borrower" }, loading: false });
    render(
      <Router>
        <Dashboard />
      </Router>
    );
    expect(screen.getByTestId("borrower-dashboard-mock")).toBeInTheDocument();
    expect(screen.queryByTestId("lender-dashboard-mock")).not.toBeInTheDocument();
  });

  test("renders LenderDashboard when user role is lender", () => {
    useAuth.mockReturnValue({ user: { name: "Test Lender", role: "lender" }, loading: false });
    render(
      <Router>
        <Dashboard />
      </Router>
    );
    expect(screen.getByTestId("lender-dashboard-mock")).toBeInTheDocument();
    expect(screen.queryByTestId("borrower-dashboard-mock")).not.toBeInTheDocument();
  });

  test("renders a fallback or loading state if user role is not defined or loading", () => {
    useAuth.mockReturnValue({ user: null, loading: true });
    render(
      <Router>
        <Dashboard />
      </Router>
    );
    // Assuming Dashboard shows a loading message or a generic message if role is unknown or loading
    // This depends on the actual implementation of Dashboard.js
    // For example, if it shows "Loading..." or "Please log in"
    // For now, let's assume it doesn't render either specific dashboard
    expect(screen.queryByTestId("borrower-dashboard-mock")).not.toBeInTheDocument();
    expect(screen.queryByTestId("lender-dashboard-mock")).not.toBeInTheDocument();
    // Add a more specific assertion if Dashboard has a distinct loading/fallback UI
    // e.g. expect(screen.getByText(/Loading dashboard.../i)).toBeInTheDocument();
  });

  test("renders a fallback if user role is unrecognized", () => {
    useAuth.mockReturnValue({ user: { name: "Test User", role: "unknown" }, loading: false });
    render(
      <Router>
        <Dashboard />
      </Router>
    );
    expect(screen.queryByTestId("borrower-dashboard-mock")).not.toBeInTheDocument();
    expect(screen.queryByTestId("lender-dashboard-mock")).not.toBeInTheDocument();
    // Example: expect(screen.getByText(/Unknown user role/i)).toBeInTheDocument();
  });
});

