import React from "react";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import WalletConnectionPage from "../../pages/WalletConnectionPage";
import { BlockchainProvider } from "../../contexts/BlockchainContext";

const MockedWalletConnectionPage = () => (
  <BrowserRouter>
    <BlockchainProvider>
      <WalletConnectionPage />
    </BlockchainProvider>
  </BrowserRouter>
);

describe("WalletConnectionPage", () => {
  test("renders wallet connection page", () => {
    render(<MockedWalletConnectionPage />);
    expect(screen.getByText(/Wallet Connection/i)).toBeInTheDocument();
  });

  test("shows connect button when not connected", () => {
    render(<MockedWalletConnectionPage />);
    expect(
      screen.getByRole("button", { name: /Connect Wallet/i }),
    ).toBeInTheDocument();
  });
});
