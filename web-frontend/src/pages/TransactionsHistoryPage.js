import React, { useState, useEffect } from "react";
import {
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
} from "@mui/material";
import { useApi } from "../contexts/ApiContext";

const TransactionsHistoryPage = () => {
  const { getMyLoans, loading, error } = useApi();
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const loans = await getMyLoans();
        const txs = (loans.data || []).flatMap((loan) =>
          (loan.transactions || []).map((tx) => ({ ...tx, loanId: loan.id })),
        );
        setTransactions(txs);
      } catch (err) {
        console.error("Error fetching transactions:", err);
      }
    };
    fetchTransactions();
  }, [getMyLoans]);

  if (loading)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <CircularProgress />
      </Box>
    );

  return (
    <Box sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Transaction History
      </Typography>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      <Paper sx={{ p: 3 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Loan ID</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {transactions.map((tx, idx) => (
                <TableRow key={idx}>
                  <TableCell>
                    {new Date(tx.date || tx.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{tx.type || "Payment"}</TableCell>
                  <TableCell>{tx.loanId}</TableCell>
                  <TableCell>${tx.amount?.toLocaleString()}</TableCell>
                  <TableCell>
                    <Chip label={tx.status || "completed"} size="small" />
                  </TableCell>
                </TableRow>
              ))}
              {transactions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    No transactions found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default TransactionsHistoryPage;
