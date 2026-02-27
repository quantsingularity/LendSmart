import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import LoanApplicationPage from "../../pages/LoanApplicationPage";
import { ApiProvider } from "../../contexts/ApiContext";
import { BlockchainProvider } from "../../contexts/BlockchainContext";

const MockedLoanApplicationPage = () => (
  <BrowserRouter>
    <BlockchainProvider>
      <ApiProvider>
        <LoanApplicationPage />
      </ApiProvider>
    </BlockchainProvider>
  </BrowserRouter>
);

describe("LoanApplicationPage", () => {
  test("renders loan application form", () => {
    render(<MockedLoanApplicationPage />);
    expect(screen.getByText(/Loan Application/i)).toBeInTheDocument();
  });

  test("shows stepper with correct steps", () => {
    render(<MockedLoanApplicationPage />);
    expect(screen.getByText(/Loan Details/i)).toBeInTheDocument();
    expect(screen.getByText(/Personal Information/i)).toBeInTheDocument();
  });

  test("validates loan amount input", async () => {
    render(<MockedLoanApplicationPage />);

    const nextButton = screen.getByRole("button", { name: /Next/i });
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(
        screen.getByText(/Please enter a valid loan amount/i),
      ).toBeInTheDocument();
    });
  });
});
