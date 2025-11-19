/**
 * Blockchain configuration for LendSmart
 */
module.exports = {
  // RPC URL for the blockchain network
  rpcUrl: process.env.BLOCKCHAIN_RPC_URL || 'http://localhost:8545',

  // Chain ID for the network
  chainId: process.env.BLOCKCHAIN_CHAIN_ID || 1337,

  // Smart contract addresses
  lendSmartLoanAddress: process.env.LEND_SMART_LOAN_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3',

  // Gas settings
  gasLimit: process.env.GAS_LIMIT || 3000000,

  // Block confirmation count
  confirmations: process.env.CONFIRMATIONS || 1
};
