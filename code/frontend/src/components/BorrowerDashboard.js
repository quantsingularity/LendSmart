import React, { useState, useEffect } from 'react';
import { useWeb3React } from '@web3-react/core';
import { Contract } from 'ethers';
import LoanManagerABI from '../../blockchain/build/contracts/LoanManager.json';

export default function BorrowerDashboard() {
  const { account, library } = useWeb3React();
  const [loans, setLoans] = useState([]);

  useEffect(() => {
    const loadLoans = async () => {
      const contract = new Contract(
        process.env.REACT_APP_LOAN_MANAGER_ADDRESS,
        LoanManagerABI.abi,
        library.getSigner()
      );
      const loanCount = await contract.borrowerLoansCount(account);
      const loans = [];
      for (let i = 0; i < loanCount; i++) {
        loans.push(await contract.borrowerLoans(account, i));
      }
      setLoans(loans);
    };
    
    if (account) loadLoans();
  }, [account]);

  return (
    <div>
      <h2>Your Loans</h2>
      {loans.map((loan, i) => (
        <div key={i}>
          Amount: {loan.amount.toString()} ETH
          Status: {['Pending', 'Approved', 'Repaid', 'Defaulted'][loan.status]}
        </div>
      ))}
    </div>
  );
}