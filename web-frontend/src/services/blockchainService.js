import { ethers } from "ethers";
import LoanContractABI from "../contracts/LoanContract.json"; // ABI of your LoanContract
import ContractAddress from "../contracts/LoanContract-address.json"; // Address of deployed contract

// Ensure environment variables are loaded for contract address and network
// const CONTRACT_ADDRESS = process.env.REACT_APP_LOAN_CONTRACT_ADDRESS || ContractAddress.address;
// const NETWORK_RPC_URL = process.env.REACT_APP_NETWORK_RPC_URL; // e.g., from Infura/Alchemy for read-only
// const CHAIN_ID = parseInt(process.env.REACT_APP_BLOCKCHAIN_NETWORK_ID || "0", 10);

let provider;
let signer;
let loanContract;
let loanContractReadOnly;

/**
 * Initializes the blockchain service, connects to MetaMask (or other provider).
 * @returns {Promise<boolean>} True if connection is successful, false otherwise.
 */
export const initBlockchainService = async () => {
    if (typeof window.ethereum === "undefined") {
        console.error("MetaMask (or other Ethereum wallet) is not installed.");
        alert("Please install MetaMask or another Ethereum wallet to use blockchain features.");
        return false;
    }

    try {
        // Request account access if needed
        await window.ethereum.request({ method: "eth_requestAccounts" });
        provider = new ethers.BrowserProvider(window.ethereum); // ethers v6
        signer = await provider.getSigner();
        const network = await provider.getNetwork();

        const expectedChainId = parseInt(process.env.REACT_APP_BLOCKCHAIN_NETWORK_ID || "0", 10);
        if (expectedChainId !== 0 && network.chainId !== BigInt(expectedChainId)) {
            alert(`Please connect to the correct network (Chain ID: ${expectedChainId}). You are on Chain ID: ${network.chainId}.`);
            // Optionally, try to switch network
            // try {
            //     await window.ethereum.request({
            //         method: 'wallet_switchEthereumChain',
            //         params: [{ chainId: ethers.utils.hexlify(expectedChainId) }],
            //     });
            //     // Re-initialize after switch
            //     provider = new ethers.BrowserProvider(window.ethereum);
            //     signer = await provider.getSigner();
            // } catch (switchError) {
            //     console.error("Failed to switch network:", switchError);
            //     return false;
            // }
            return false;
        }

        const contractAddress = process.env.REACT_APP_LOAN_CONTRACT_ADDRESS || ContractAddress.address;
        if (!contractAddress || contractAddress === "") {
            console.error("LoanContract address is not configured. Check .env (REACT_APP_LOAN_CONTRACT_ADDRESS) or src/contracts/LoanContract-address.json");
            alert("Smart contract address not found. Blockchain features may not work.");
            return false;
        }

        loanContract = new ethers.Contract(contractAddress, LoanContractABI.abi, signer);
        
        // For read-only operations, you might use a public RPC if user is not connected
        // const readOnlyProvider = NETWORK_RPC_URL ? new ethers.JsonRpcProvider(NETWORK_RPC_URL) : provider;
        loanContractReadOnly = new ethers.Contract(contractAddress, LoanContractABI.abi, provider); // Use connected provider for reads too for simplicity

        console.log("Blockchain service initialized.");
        console.log("Signer address:", await signer.getAddress());
        console.log("Contract address:", contractAddress);
        return true;

    } catch (error) {
        console.error("Error initializing blockchain service:", error);
        alert("Could not connect to blockchain. Please check your wallet and network connection.");
        return false;
    }
};

/**
 * Gets the current connected account address.
 * @returns {Promise<string|null>} The account address or null if not connected.
 */
export const getConnectedAccount = async () => {
    if (!signer) {
        await initBlockchainService(); // Attempt to initialize if not already
    }
    return signer ? await signer.getAddress() : null;
};

// --- LoanContract Interaction Functions ---

/**
 * Requests a new loan on the smart contract.
 * @param {string} tokenAddress The ERC20 token address for the loan.
 * @param {string} principal Amount of tokens (in smallest unit, e.g., wei for ETH-like tokens).
 * @param {number} interestRate Annual interest rate (e.g., 500 for 5.00%).
 * @param {number} duration Loan duration in seconds.
 * @param {string} purpose Description or IPFS hash for the loan purpose.
 * @returns {Promise<ethers.TransactionResponse>} The transaction object.
 */
export const requestLoanOnChain = async (tokenAddress, principal, interestRate, duration, purpose) => {
    if (!loanContract) throw new Error("Blockchain service not initialized or contract not loaded.");
    try {
        // Ensure principal is a BigInt or string representing a large number
        const principalAmount = ethers.parseUnits(principal.toString(), 18); // Assuming 18 decimals for the token
        const tx = await loanContract.requestLoan(tokenAddress, principalAmount, interestRate, duration, purpose);
        return tx;
    } catch (error) {
        console.error("Error requesting loan on chain:", error);
        throw error;
    }
};

/**
 * Funds an existing loan request on the smart contract.
 * @param {number} loanId The ID of the loan to fund.
 * @param {string} tokenAddress The ERC20 token address (needed for approval).
 * @param {string} amountToFund The amount of tokens to fund (in smallest unit).
 * @returns {Promise<ethers.TransactionResponse>} The transaction object.
 */
export const fundLoanOnChain = async (loanId, tokenAddress, amountToFund) => {
    if (!loanContract) throw new Error("Blockchain service not initialized or contract not loaded.");
    try {
        const tokenContract = new ethers.Contract(tokenAddress, LoanContractABI.abi_erc20, signer); // Assuming a generic ERC20 ABI fragment for approve
        const amount = ethers.parseUnits(amountToFund.toString(), 18); // Assuming 18 decimals
        
        // Approve the LoanContract to spend tokens on behalf of the lender
        const approveTx = await tokenContract.approve(await loanContract.getAddress(), amount);
        await approveTx.wait(); // Wait for approval to be mined
        console.log("Token approval successful for funding.");

        const tx = await loanContract.fundLoan(loanId);
        return tx;
    } catch (error) {
        console.error("Error funding loan on chain:", error);
        throw error;
    }
};

/**
 * Repays a loan on the smart contract.
 * @param {number} loanId The ID of the loan to repay.
 * @param {string} tokenAddress The ERC20 token address (needed for approval).
 * @param {string} amountToRepay The amount of tokens to repay (in smallest unit).
 * @returns {Promise<ethers.TransactionResponse>} The transaction object.
 */
export const repayLoanOnChain = async (loanId, tokenAddress, amountToRepay) => {
    if (!loanContract) throw new Error("Blockchain service not initialized or contract not loaded.");
    try {
        const tokenContract = new ethers.Contract(tokenAddress, LoanContractABI.abi_erc20, signer); // Generic ERC20 ABI
        const amount = ethers.parseUnits(amountToRepay.toString(), 18); // Assuming 18 decimals

        // Approve the LoanContract to spend tokens on behalf of the borrower for repayment
        const approveTx = await tokenContract.approve(await loanContract.getAddress(), amount);
        await approveTx.wait(); // Wait for approval to be mined
        console.log("Token approval successful for repayment.");

        const tx = await loanContract.repayLoan(loanId, amount);
        return tx;
    } catch (error) {
        console.error("Error repaying loan on chain:", error);
        throw error;
    }
};

/**
 * Gets details of a specific loan from the smart contract.
 * @param {number} loanId The ID of the loan.
 * @returns {Promise<object>} Loan details object.
 */
export const getLoanDetailsFromChain = async (loanId) => {
    if (!loanContractReadOnly) throw new Error("Blockchain service not initialized or read-only contract not loaded.");
    try {
        const loanDetails = await loanContractReadOnly.getLoanDetails(loanId);
        // Convert BigInts to strings for easier handling in JS, format if needed
        return {
            id: loanDetails.id.toString(),
            borrower: loanDetails.borrower,
            lender: loanDetails.lender,
            token: loanDetails.token,
            principal: ethers.formatUnits(loanDetails.principal, 18), // Assuming 18 decimals
            interestRate: loanDetails.interestRate.toString(),
            duration: loanDetails.duration.toString(),
            requestedTime: loanDetails.requestedTime.toString(),
            fundedTime: loanDetails.fundedTime.toString(),
            repaymentAmount: ethers.formatUnits(loanDetails.repaymentAmount, 18),
            amountRepaid: ethers.formatUnits(loanDetails.amountRepaid, 18),
            status: loanDetails.status, // Enum will be a number, map to string in UI
            purpose: loanDetails.purpose,
        };
    } catch (error) {
        console.error(`Error fetching loan details for ID ${loanId} from chain:`, error);
        throw error;
    }
};

/**
 * Gets all loan IDs for a given user from the smart contract.
 * @param {string} userAddress The address of the user.
 * @returns {Promise<Array<string>>} Array of loan IDs as strings.
 */
export const getUserLoansFromChain = async (userAddress) => {
    if (!loanContractReadOnly) throw new Error("Blockchain service not initialized or read-only contract not loaded.");
    try {
        const loanIdsBigInt = await loanContractReadOnly.getUserLoans(userAddress);
        return loanIdsBigInt.map(id => id.toString());
    } catch (error) {
        console.error(`Error fetching loans for user ${userAddress} from chain:`, error);
        throw error;
    }
};

// Add a placeholder for ERC20 ABI fragment needed for approve function
// This should ideally be a separate, more complete ERC20 ABI if used extensively
LoanContractABI.abi_erc20 = [
    {
        "constant": false,
        "inputs": [
            {
                "name": "_spender",
                "type": "address"
            },
            {
                "name": "_value",
                "type": "uint256"
            }
        ],
        "name": "approve",
        "outputs": [
            {
                "name": "",
                "type": "bool"
            }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [
            {
                "name": "_owner",
                "type": "address"
            },
            {
                "name": "_spender",
                "type": "address"
            }
        ],
        "name": "allowance",
        "outputs": [
            {
                "name": "",
                "type": "uint256"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    }
];

// Call initBlockchainService on load or when app starts
// initBlockchainService(); // Or call this from a top-level component like App.js

