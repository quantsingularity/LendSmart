import React, { useState } from 'react';
import Web3 from 'web3';
import { Button, TextField, Container } from '@material-ui/core';

export default function LoanApplication() {
  const [amount, setAmount] = useState('');
  const [duration, setDuration] = useState('');
  const web3 = new Web3(Web3.givenProvider);

  const handleSubmit = async () => {
    const accounts = await web3.eth.getAccounts();
    const riskAssessment = await fetch('/api/apply-loan', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        income: 50000,
        creditHistory: 720,
        loanAmount: amount,
        employmentYears: 5
      })
    });
    
    if ((await riskAssessment.json()).approved) {
      // Interact with smart contract
    }
  };

  return (
    <Container maxWidth="sm">
      <TextField label="Loan Amount" fullWidth onChange={e => setAmount(e.target.value)} />
      <TextField label="Duration (Days)" fullWidth onChange={e => setDuration(e.target.value)} />
      <Button variant="contained" color="primary" onClick={handleSubmit}>
        Apply
      </Button>
    </Container>
  );
}