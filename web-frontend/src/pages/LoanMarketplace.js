import React, { useState, useEffect } from "react";
import {
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  IconButton,
  Divider,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useApi } from "../contexts/ApiContext";
import { useBlockchain } from "../contexts/BlockchainContext";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import SortIcon from "@mui/icons-material/Sort";

const LoanMarketplace = () => {
  const navigate = useNavigate();
  const { getLoans } = useApi();
  const { isConnected } = useBlockchain();

  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    status: "",
    minAmount: "",
    maxAmount: "",
  });

  useEffect(() => {
    fetchLoans();
  }, []);

  const fetchLoans = async () => {
    try {
      setLoading(true);
      setError(null);

      // Only get loans with status 'Requested' for the marketplace
      const result = await getLoans({ status: "Requested" });

      setLoans(result.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching loans:", err);
      setError("Failed to fetch available loans");
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value,
    });
  };

  const applyFilters = () => {
    // This would typically make an API call with filters
    // For now, we'll just refresh the loans
    fetchLoans();
  };

  const handleViewLoan = (id) => {
    navigate(`/loans/${id}`);
  };

  // Filter loans based on search term
  const filteredLoans = loans.filter(
    (loan) =>
      loan.purpose?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loan.borrower?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loan.blockchainId?.toString().includes(searchTerm),
  );

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Loan Marketplace
      </Typography>

      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search loans by purpose, borrower, or ID"
              value={searchTerm}
              onChange={handleSearch}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                label="Min Amount"
                name="minAmount"
                type="number"
                size="small"
                value={filters.minAmount}
                onChange={handleFilterChange}
                sx={{ flexGrow: 1 }}
              />
              <TextField
                label="Max Amount"
                name="maxAmount"
                type="number"
                size="small"
                value={filters.maxAmount}
                onChange={handleFilterChange}
                sx={{ flexGrow: 1 }}
              />
              <Button
                variant="contained"
                startIcon={<FilterListIcon />}
                onClick={applyFilters}
              >
                Filter
              </Button>
              <IconButton>
                <SortIcon />
              </IconButton>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
          <CircularProgress />
        </Box>
      ) : filteredLoans.length === 0 ? (
        <Paper elevation={2} sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="h6" color="text.secondary">
            No loans available matching your criteria
          </Typography>
          <Button
            variant="contained"
            sx={{ mt: 2 }}
            onClick={() => navigate("/apply")}
            disabled={!isConnected}
          >
            Apply for a Loan
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {filteredLoans.map((loan) => (
            <Grid
              item
              xs={12}
              md={6}
              lg={4}
              key={loan._id || loan.blockchainId}
            >
              <Card elevation={2}>
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 2,
                    }}
                  >
                    <Typography variant="h6" component="div" noWrap>
                      {loan.purpose}
                    </Typography>
                    <Chip
                      label={loan.status}
                      color={
                        loan.status === "Requested" ? "primary" : "default"
                      }
                      size="small"
                    />
                  </Box>

                  <Typography color="text.secondary" gutterBottom>
                    ID: {loan.blockchainId}
                  </Typography>

                  <Divider sx={{ my: 1.5 }} />

                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Principal:
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {loan.principal} Tokens
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Interest Rate:
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {loan.interestRate}%
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Duration:
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {loan.duration} days
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Collateralized:
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {loan.isCollateralized ? "Yes" : "No"}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    onClick={() =>
                      handleViewLoan(loan._id || loan.blockchainId)
                    }
                    fullWidth
                  >
                    View Details
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default LoanMarketplace;
