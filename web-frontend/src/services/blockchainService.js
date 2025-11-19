import { ethers } from "ethers";
import LoanContractABI from "../contracts/LoanContract.json"; // ABI of your LoanContract
import ContractAddress from "../contracts/LoanContract-address.json"; // Address of deployed contract

// Configuration constants
const CONTRACT_ADDRESS = process.env.REACT_APP_LOAN_CONTRACT_ADDRESS || (ContractAddress?.address || "");
const NETWORK_RPC_URL = process.env.REACT_APP_NETWORK_RPC_URL || "https://rpc.ankr.com/eth"; // Default fallback RPC
const CHAIN_ID = parseInt(process.env.REACT_APP_BLOCKCHAIN_NETWORK_ID || "1", 10); // Default to Ethereum mainnet
const BLOCKCHAIN_ENABLED = process.env.REACT_APP_BLOCKCHAIN_ENABLED !== "false"; // Enable by default

// Service state
let provider;
let signer;
let loanContract;
let loanContractReadOnly;
let isInitialized = false;
let walletConnected = false;

/**
 * Checks if blockchain features are enabled in the application
 * @returns {boolean} True if blockchain features are enabled
 */
export const isEnabled = () => {
  return BLOCKCHAIN_ENABLED;
};

/**
 * Checks if wallet is connected
 * @returns {boolean} True if wallet is connected
 */
export const isWalletConnected = () => {
  return walletConnected;
};

/**
 * Initializes the blockchain service, connects to MetaMask (or other provider).
 * @returns {Promise<boolean>} True if connection is successful, false otherwise.
 */
export const initBlockchainService = async () => {
  if (!BLOCKCHAIN_ENABLED) {
    console.log("Blockchain features are disabled in this environment");
    return false;
  }

  if (typeof window.ethereum === "undefined") {
    console.error("MetaMask (or other Ethereum wallet) is not installed.");
    return false;
  }

  try {
    // Request account access if needed
    await window.ethereum.request({ method: "eth_requestAccounts" });
    provider = new ethers.BrowserProvider(window.ethereum); // ethers v6
    signer = await provider.getSigner();
    const network = await provider.getNetwork();

    // Check if on the correct network
    if (CHAIN_ID !== 0 && network.chainId !== BigInt(String(CHAIN_ID))) {
      console.warn(`Connected to wrong network. Expected chain ID: ${CHAIN_ID}, got: ${network.chainId}`);

      // Try to switch network
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${CHAIN_ID.toString(16)}` }],
        });

        // Re-initialize after switch
        provider = new ethers.BrowserProvider(window.ethereum);
        signer = await provider.getSigner();
      } catch (switchError) {
        // This error code indicates that the chain has not been added to MetaMask
        if (switchError.code === 4902) {
          try {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: `0x${CHAIN_ID.toString(16)}`,
                  chainName: getNetworkName(CHAIN_ID),
                  nativeCurrency: {
                    name: 'Ether',
                    symbol: 'ETH',
                    decimals: 18
                  },
                  rpcUrls: [NETWORK_RPC_URL],
                  blockExplorerUrls: [getBlockExplorerUrl(CHAIN_ID)]
                }
              ],
            });

            // Re-initialize after adding network
            provider = new ethers.BrowserProvider(window.ethereum);
            signer = await provider.getSigner();
          } catch (addError) {
            console.error("Failed to add network:", addError);
            return false;
          }
        } else {
          console.error("Failed to switch network:", switchError);
          return false;
        }
      }
    }

    // Initialize contract instances
    if (CONTRACT_ADDRESS && CONTRACT_ADDRESS !== "") {
      loanContract = new ethers.Contract(CONTRACT_ADDRESS, LoanContractABI.abi, signer);

      // For read-only operations, use a public RPC if user is not connected
      const readOnlyProvider = NETWORK_RPC_URL ?
        new ethers.JsonRpcProvider(NETWORK_RPC_URL) : provider;
      loanContractReadOnly = new ethers.Contract(CONTRACT_ADDRESS, LoanContractABI.abi, readOnlyProvider);
    } else {
      console.warn("LoanContract address is not configured. Some blockchain features may not work.");
    }

    // Set up event listeners for wallet changes
    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);
    window.ethereum.on('disconnect', handleDisconnect);

    isInitialized = true;
    walletConnected = true;

    console.log("Blockchain service initialized successfully");
    console.log("Connected account:", await signer.getAddress());

    return true;
  } catch (error) {
    console.error("Error initializing blockchain service:", error);
    return false;
  }
};

/**
 * Handles when user changes accounts in their wallet
 * @param {Array<string>} accounts The new accounts
 */
const handleAccountsChanged = async (accounts) => {
  if (accounts.length === 0) {
    // User disconnected their wallet
    walletConnected = false;
    console.log("Wallet disconnected");

    // Use read-only provider for contract interactions
    if (CONTRACT_ADDRESS && CONTRACT_ADDRESS !== "") {
      const readOnlyProvider = NETWORK_RPC_URL ?
        new ethers.JsonRpcProvider(NETWORK_RPC_URL) : provider;
      loanContractReadOnly = new ethers.Contract(CONTRACT_ADDRESS, LoanContractABI.abi, readOnlyProvider);
    }

    // Dispatch event for UI to update
    window.dispatchEvent(new CustomEvent('walletDisconnected'));
  } else {
    // User switched accounts
    try {
      provider = new ethers.BrowserProvider(window.ethereum);
      signer = await provider.getSigner();

      if (CONTRACT_ADDRESS && CONTRACT_ADDRESS !== "") {
        loanContract = new ethers.Contract(CONTRACT_ADDRESS, LoanContractABI.abi, signer);
      }

      walletConnected = true;
      console.log("Wallet account changed:", accounts[0]);

      // Dispatch event for UI to update
      window.dispatchEvent(new CustomEvent('walletAccountChanged', {
        detail: { account: accounts[0] }
      }));
    } catch (error) {
      console.error("Error handling account change:", error);
    }
  }
};

/**
 * Handles when user changes networks in their wallet
 */
const handleChainChanged = () => {
  // Reload the page when chain changes
  window.location.reload();
};

/**
 * Handles wallet disconnect events
 */
const handleDisconnect = () => {
  walletConnected = false;
  console.log("Wallet disconnected");

  // Dispatch event for UI to update
  window.dispatchEvent(new CustomEvent('walletDisconnected'));
};

/**
 * Gets the current connected account address.
 * @returns {Promise<string|null>} The account address or null if not connected.
 */
export const getConnectedAccount = async () => {
  if (!walletConnected) {
    const success = await initBlockchainService();
    if (!success) return null;
  }

  try {
    return signer ? await signer.getAddress() : null;
  } catch (error) {
    console.error("Error getting connected account:", error);
    return null;
  }
};

/**
 * Gets the current connected network information
 * @returns {Promise<object|null>} Network information or null if not connected
 */
export const getNetworkInfo = async () => {
  if (!provider) {
    const success = await initBlockchainService();
    if (!success) return null;
  }

  try {
    const network = await provider.getNetwork();
    return {
      chainId: Number(network.chainId),
      name: network.name || getNetworkName(Number(network.chainId))
    };
  } catch (error) {
    console.error("Error getting network info:", error);
    return null;
  }
};

/**
 * Disconnects the wallet
 * @returns {Promise<boolean>} True if disconnection was successful
 */
export const disconnectWallet = async () => {
  if (!walletConnected) return true;

  try {
    // For most wallets, we can't force disconnect, but we can clean up our state
    walletConnected = false;

    // Use read-only provider for contract interactions
    if (CONTRACT_ADDRESS && CONTRACT_ADDRESS !== "") {
      const readOnlyProvider = NETWORK_RPC_URL ?
        new ethers.JsonRpcProvider(NETWORK_RPC_URL) : provider;
      loanContractReadOnly = new ethers.Contract(CONTRACT_ADDRESS, LoanContractABI.abi, readOnlyProvider);
    }

    // Dispatch event for UI to update
    window.dispatchEvent(new CustomEvent('walletDisconnected'));

    return true;
  } catch (error) {
    console.error("Error disconnecting wallet:", error);
    return false;
  }
};

// --- LoanContract Interaction Functions ---

/**
 * Deploys a new loan contract for a specific loan
 * @param {string} borrowerAddress The borrower's wallet address
 * @param {string} lenderAddress The lender's wallet address
 * @param {number} amount The loan amount
 * @param {number} interestRate The annual interest rate (e.g., 5.0 for 5%)
 * @param {number} termMonths The loan term in months
 * @param {string} loanId The backend loan ID to associate with this contract
 * @returns {Promise<string>} The deployed contract address
 */
export const deployLoanContract = async (borrowerAddress, lenderAddress, amount, interestRate, termMonths, loanId) => {
  if (!isEnabled()) {
    console.log("Blockchain features are disabled");
    return null;
  }

  if (!walletConnected) {
    const success = await initBlockchainService();
    if (!success) throw new Error("Wallet connection required");
  }

  try {
    // Get the contract factory
    const loanContractFactory = new ethers.ContractFactory(
      LoanContractABI.abi,
      LoanContractABI.bytecode,
      signer
    );

    // Convert amount to wei (assuming amount is in ETH)
    const amountWei = ethers.parseEther(amount.toString());

    // Convert interest rate to basis points (e.g., 5.0% -> 500)
    const interestRateBps = Math.round(interestRate * 100);

    // Convert term months to seconds
    const termSeconds = termMonths * 30 * 24 * 60 * 60;

    // Deploy the contract
    const contract = await loanContractFactory.deploy(
      borrowerAddress,
      lenderAddress,
      amountWei,
      interestRateBps,
      termSeconds,
      loanId
    );

    // Wait for deployment to complete
    await contract.waitForDeployment();

    // Get the contract address
    const contractAddress = await contract.getAddress();
    console.log(`Loan contract deployed at: ${contractAddress}`);

    return contractAddress;
  } catch (error) {
    console.error("Error deploying loan contract:", error);
    throw error;
  }
};

/**
 * Funds a loan on the blockchain
 * @param {string} contractAddress The loan contract address
 * @param {string} borrowerAddress The borrower's wallet address
 * @param {string} lenderAddress The lender's wallet address (should match connected wallet)
 * @param {number} amount The amount to fund
 * @returns {Promise<string>} The transaction hash
 */
export const fundLoan = async (contractAddress, borrowerAddress, lenderAddress, amount) => {
  if (!isEnabled()) {
    console.log("Blockchain features are disabled");
    return null;
  }

  if (!walletConnected) {
    const success = await initBlockchainService();
    if (!success) throw new Error("Wallet connection required");
  }

  try {
    // Verify the connected account matches the lender
    const connectedAccount = await getConnectedAccount();
    if (connectedAccount.toLowerCase() !== lenderAddress.toLowerCase()) {
      throw new Error("Connected wallet does not match lender address");
    }

    // Create contract instance for this specific loan
    const loanContract = new ethers.Contract(contractAddress, LoanContractABI.abi, signer);

    // Convert amount to wei
    const amountWei = ethers.parseEther(amount.toString());

    // Send transaction to fund the loan
    const tx = await loanContract.fundLoan({ value: amountWei });

    // Wait for transaction to be mined
    await tx.wait();

    console.log(`Loan funded successfully. Transaction hash: ${tx.hash}`);
    return tx.hash;
  } catch (error) {
    console.error("Error funding loan:", error);
    throw error;
  }
};

/**
 * Repays a loan on the blockchain
 * @param {string} contractAddress The loan contract address
 * @param {string} borrowerAddress The borrower's wallet address (should match connected wallet)
 * @param {string} lenderAddress The lender's wallet address
 * @param {number} amount The amount to repay
 * @param {number} installmentNumber The installment number being repaid
 * @returns {Promise<string>} The transaction hash
 */
export const repayLoan = async (contractAddress, borrowerAddress, lenderAddress, amount, installmentNumber) => {
  if (!isEnabled()) {
    console.log("Blockchain features are disabled");
    return null;
  }

  if (!walletConnected) {
    const success = await initBlockchainService();
    if (!success) throw new Error("Wallet connection required");
  }

  try {
    // Verify the connected account matches the borrower
    const connectedAccount = await getConnectedAccount();
    if (connectedAccount.toLowerCase() !== borrowerAddress.toLowerCase()) {
      throw new Error("Connected wallet does not match borrower address");
    }

    // Create contract instance for this specific loan
    const loanContract = new ethers.Contract(contractAddress, LoanContractABI.abi, signer);

    // Convert amount to wei
    const amountWei = ethers.parseEther(amount.toString());

    // Send transaction to repay the loan
    const tx = await loanContract.repayLoan(installmentNumber, { value: amountWei });

    // Wait for transaction to be mined
    await tx.wait();

    console.log(`Loan repayment successful. Transaction hash: ${tx.hash}`);
    return tx.hash;
  } catch (error) {
    console.error("Error repaying loan:", error);
    throw error;
  }
};

/**
 * Gets the loan details from the blockchain
 * @param {string} contractAddress The loan contract address
 * @returns {Promise<object>} The loan details
 */
export const getLoanDetails = async (contractAddress) => {
  if (!isEnabled()) {
    console.log("Blockchain features are disabled");
    return null;
  }

  try {
    // Create a read-only contract instance
    const provider = new ethers.JsonRpcProvider(NETWORK_RPC_URL);
    const contract = new ethers.Contract(contractAddress, LoanContractABI.abi, provider);

    // Get loan details
    const details = await contract.getLoanDetails();

    // Format the response
    return {
      borrower: details.borrower,
      lender: details.lender,
      amount: ethers.formatEther(details.amount),
      interestRate: Number(details.interestRateBps) / 100,
      termSeconds: Number(details.termSeconds),
      startDate: new Date(Number(details.startDate) * 1000),
      status: getLoanStatusString(Number(details.status)),
      amountRepaid: ethers.formatEther(details.amountRepaid),
      remainingBalance: ethers.formatEther(details.remainingBalance),
      nextPaymentDue: new Date(Number(details.nextPaymentDue) * 1000),
      loanId: details.loanId
    };
  } catch (error) {
    console.error("Error getting loan details:", error);
    throw error;
  }
};

/**
 * Gets the transaction history for a loan from the blockchain
 * @param {string} contractAddress The loan contract address
 * @returns {Promise<Array>} Array of transaction objects
 */
export const getLoanTransactionHistory = async (contractAddress) => {
  if (!isEnabled()) {
    console.log("Blockchain features are disabled");
    return [];
  }

  try {
    // Create a provider to query events
    const provider = new ethers.JsonRpcProvider(NETWORK_RPC_URL);
    const contract = new ethers.Contract(contractAddress, LoanContractABI.abi, provider);

    // Get the contract creation block
    const code = await provider.getCode(contractAddress);
    if (code === "0x") {
      throw new Error("Contract not found at the provided address");
    }

    // Get funding events
    const fundingFilter = contract.filters.LoanFunded();
    const fundingEvents = await contract.queryFilter(fundingFilter);

    // Get repayment events
    const repaymentFilter = contract.filters.LoanRepayment();
    const repaymentEvents = await contract.queryFilter(repaymentFilter);

    // Get completion events
    const completionFilter = contract.filters.LoanCompleted();
    const completionEvents = await contract.queryFilter(completionFilter);

    // Get default events
    const defaultFilter = contract.filters.LoanDefaulted();
    const defaultEvents = await contract.queryFilter(defaultFilter);

    // Combine and format all events
    const allEvents = [
      ...fundingEvents.map(event => ({
        type: "Funding",
        amount: ethers.formatEther(event.args.amount),
        timestamp: new Date(Number(event.args.timestamp) * 1000),
        hash: event.transactionHash,
        from: event.args.lender
      })),
      ...repaymentEvents.map(event => ({
        type: "Repayment",
        amount: ethers.formatEther(event.args.amount),
        timestamp: new Date(Number(event.args.timestamp) * 1000),
        hash: event.transactionHash,
        from: event.args.borrower,
        installmentNumber: Number(event.args.installmentNumber)
      })),
      ...completionEvents.map(event => ({
        type: "Completion",
        timestamp: new Date(Number(event.args.timestamp) * 1000),
        hash: event.transactionHash
      })),
      ...defaultEvents.map(event => ({
        type: "Default",
        timestamp: new Date(Number(event.args.timestamp) * 1000),
        hash: event.transactionHash
      }))
    ];

    // Sort by timestamp
    allEvents.sort((a, b) => a.timestamp - b.timestamp);

    return allEvents;
  } catch (error) {
    console.error("Error getting loan transaction history:", error);
    return [];
  }
};

/**
 * Gets the wallet balance
 * @returns {Promise<string>} The wallet balance in ETH
 */
export const getWalletBalance = async () => {
  if (!walletConnected) {
    const success = await initBlockchainService();
    if (!success) return "0";
  }

  try {
    const address = await signer.getAddress();
    const balance = await provider.getBalance(address);
    return ethers.formatEther(balance);
  } catch (error) {
    console.error("Error getting wallet balance:", error);
    return "0";
  }
};

/**
 * Estimates gas for a transaction
 * @param {string} contractAddress The contract address
 * @param {string} method The method to call
 * @param {Array} params The parameters for the method
 * @param {object} options Additional options (value, etc.)
 * @returns {Promise<string>} The estimated gas in ETH
 */
export const estimateGas = async (contractAddress, method, params = [], options = {}) => {
  if (!walletConnected) {
    const success = await initBlockchainService();
    if (!success) throw new Error("Wallet connection required");
  }

  try {
    const contract = new ethers.Contract(contractAddress, LoanContractABI.abi, signer);
    const gasEstimate = await contract[method].estimateGas(...params, options);
    const gasPrice = await provider.getGasPrice();
    const gasCost = gasEstimate * gasPrice;

    return ethers.formatEther(gasCost);
  } catch (error) {
    console.error("Error estimating gas:", error);
    throw error;
  }
};

// --- Helper Functions ---

/**
 * Gets the network name from chain ID
 * @param {number} chainId The chain ID
 * @returns {string} The network name
 */
const getNetworkName = (chainId) => {
  const networks = {
    1: "Ethereum Mainnet",
    5: "Goerli Testnet",
    11155111: "Sepolia Testnet",
    137: "Polygon Mainnet",
    80001: "Mumbai Testnet",
    56: "Binance Smart Chain",
    97: "BSC Testnet",
    42161: "Arbitrum One",
    421613: "Arbitrum Goerli"
  };

  return networks[chainId] || `Chain ID ${chainId}`;
};

/**
 * Gets the block explorer URL for a chain
 * @param {number} chainId The chain ID
 * @returns {string} The block explorer URL
 */
const getBlockExplorerUrl = (chainId) => {
  const explorers = {
    1: "https://etherscan.io",
    5: "https://goerli.etherscan.io",
    11155111: "https://sepolia.etherscan.io",
    137: "https://polygonscan.com",
    80001: "https://mumbai.polygonscan.com",
    56: "https://bscscan.com",
    97: "https://testnet.bscscan.com",
    42161: "https://arbiscan.io",
    421613: "https://goerli.arbiscan.io"
  };

  return explorers[chainId] || "";
};

/**
 * Converts numeric loan status to string
 * @param {number} status The numeric status
 * @returns {string} The status string
 */
const getLoanStatusString = (status) => {
  const statuses = {
    0: "Pending",
    1: "Funded",
    2: "Active",
    3: "Completed",
    4: "Defaulted",
    5: "Cancelled"
  };

  return statuses[status] || "Unknown";
};

// Export a default object for easier imports
export default {
  isEnabled,
  isWalletConnected,
  initBlockchainService,
  getConnectedAccount,
  getNetworkInfo,
  disconnectWallet,
  deployLoanContract,
  fundLoan,
  repayLoan,
  getLoanDetails,
  getLoanTransactionHistory,
  getWalletBalance,
  estimateGas
};
