import React, { useState, useEffect } from "react";
import {
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  CircularProgress,
  Alert,
} from "@mui/material";
import { useApi } from "../contexts/ApiContext";
import PeopleIcon from "@mui/icons-material/People";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import WarningIcon from "@mui/icons-material/Warning";

const AdminDashboardPage = () => {
  const { getLoans, loading, error } = useApi();
  const [stats, setStats] = useState({
    totalLoans: 0,
    activeLoans: 0,
    totalVolume: 0,
    defaultRate: 0,
  });
  const [loans, setLoans] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const loansData = await getLoans();
        setLoans(loansData.data || []);

        // Calculate statistics
        const totalLoans = loansData.data?.length || 0;
        const activeLoans =
          loansData.data?.filter(
            (l) => l.status === "active" || l.status === "funded",
          ).length || 0;
        const totalVolume =
          loansData.data?.reduce((sum, l) => sum + (l.amount || 0), 0) || 0;
        const defaulted =
          loansData.data?.filter((l) => l.status === "defaulted").length || 0;
        const defaultRate =
          totalLoans > 0 ? ((defaulted / totalLoans) * 100).toFixed(2) : 0;

        setStats({
          totalLoans,
          activeLoans,
          totalVolume,
          defaultRate,
        });
      } catch (err) {
        console.error("Error fetching admin data:", err);
      }
    };

    fetchData();
  }, [getLoans]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 4, mb: 4 }}>
      <Typography component="h1" variant="h4" gutterBottom>
        Admin Dashboard
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <AccountBalanceIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Total Loans</Typography>
              </Box>
              <Typography variant="h4">{stats.totalLoans}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <TrendingUpIcon color="success" sx={{ mr: 1 }} />
                <Typography variant="h6">Active Loans</Typography>
              </Box>
              <Typography variant="h4">{stats.activeLoans}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <PeopleIcon color="info" sx={{ mr: 1 }} />
                <Typography variant="h6">Total Volume</Typography>
              </Box>
              <Typography variant="h4">
                ${stats.totalVolume.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <WarningIcon color="warning" sx={{ mr: 1 }} />
                <Typography variant="h6">Default Rate</Typography>
              </Box>
              <Typography variant="h4">{stats.defaultRate}%</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Recent Loans
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Loan ID</TableCell>
                <TableCell>Borrower</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loans.slice(0, 10).map((loan) => (
                <TableRow key={loan.id || loan._id}>
                  <TableCell>{loan.id || loan._id}</TableCell>
                  <TableCell>{loan.borrower?.name || "N/A"}</TableCell>
                  <TableCell>${loan.amount?.toLocaleString()}</TableCell>
                  <TableCell>
                    <Chip
                      label={loan.status}
                      color={
                        loan.status === "active"
                          ? "success"
                          : loan.status === "defaulted"
                            ? "error"
                            : "default"
                      }
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {loan.createdAt
                      ? new Date(loan.createdAt).toLocaleDateString()
                      : "N/A"}
                  </TableCell>
                  <TableCell>
                    <Button size="small" variant="outlined">
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default AdminDashboardPage;
