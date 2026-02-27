import React, { useState, useEffect } from "react";
import {
  Typography,
  Box,
  Paper,
  Button,
  Card,
  CardContent,
  Alert,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
} from "@mui/material";
import { useBlockchain } from "../contexts/BlockchainContext";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";

const WalletConnectionPage = () => {
  const {
    account,
    chainId,
    isConnected,
    connectWallet,
    disconnectWallet,
    isLoading,
    error,
  } = useBlockchain();

  const [walletBalance, setWalletBalance] = useState(null);
  const [networkName, setNetworkName] = useState("");

  useEffect(() => {
    if (chainId) {
      const networks = {
        1: "Ethereum Mainnet",
        5: "Goerli Testnet",
        11155111: "Sepolia Testnet",
        31337: "Localhost",
        137: "Polygon Mainnet",
        80001: "Mumbai Testnet",
      };
      setNetworkName(networks[Number(chainId)] || `Chain ID ${chainId}`);
    }
  }, [chainId]);

  useEffect(() => {
    const fetchBalance = async () => {
      if (isConnected && account && window.ethereum) {
        try {
          const balance = await window.ethereum.request({
            method: "eth_getBalance",
            params: [account, "latest"],
          });
          const ethBalance = parseInt(balance, 16) / 1e18;
          setWalletBalance(ethBalance.toFixed(4));
        } catch (err) {
          console.error("Error fetching balance:", err);
        }
      }
    };
    fetchBalance();
  }, [isConnected, account]);

  return (
    <Box sx={{ maxWidth: 800, mx: "auto", mt: 4, mb: 4 }}>
      <Typography component="h1" variant="h4" gutterBottom>
        Wallet Connection
      </Typography>

      <Paper sx={{ p: 4, mb: 3 }}>
        <Box sx={{ textAlign: "center", mb: 3 }}>
          <AccountBalanceWalletIcon
            sx={{
              fontSize: 80,
              color: isConnected ? "success.main" : "grey.400",
            }}
          />
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {isConnected ? (
          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <CheckCircleIcon color="success" sx={{ mr: 1 }} />
                <Typography variant="h6">Connected</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <List>
                <ListItem>
                  <ListItemText
                    primary="Wallet Address"
                    secondary={account}
                    secondaryTypographyProps={{
                      sx: { wordBreak: "break-all" },
                    }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Network" secondary={networkName} />
                </ListItem>
                {walletBalance !== null && (
                  <ListItem>
                    <ListItemText
                      primary="Balance"
                      secondary={`${walletBalance} ETH`}
                    />
                  </ListItem>
                )}
              </List>
              <Button
                variant="outlined"
                color="error"
                onClick={disconnectWallet}
                fullWidth
                sx={{ mt: 2 }}
              >
                Disconnect Wallet
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Box sx={{ textAlign: "center" }}>
            <Typography variant="body1" color="text.secondary" paragraph>
              Connect your Ethereum wallet to access blockchain features
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={connectWallet}
              disabled={isLoading}
              startIcon={
                isLoading ? (
                  <CircularProgress size={20} />
                ) : (
                  <AccountBalanceWalletIcon />
                )
              }
            >
              {isLoading ? "Connecting..." : "Connect Wallet"}
            </Button>
          </Box>
        )}
      </Paper>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Supported Wallets
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <List>
            <ListItem>
              <ListItemText
                primary="MetaMask"
                secondary="The most popular Ethereum wallet"
              />
              <Chip label="Recommended" color="primary" size="small" />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="WalletConnect"
                secondary="Connect with mobile wallets"
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Coinbase Wallet"
                secondary="User-friendly wallet by Coinbase"
              />
            </ListItem>
          </List>
        </CardContent>
      </Card>
    </Box>
  );
};

export default WalletConnectionPage;
