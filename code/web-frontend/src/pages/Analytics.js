import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Box, 
  Container, 
  Grid, 
  Paper, 
  CircularProgress,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Alert
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

function Analytics() {
  const { isAuthenticated, userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [loanData, setLoanData] = useState([]);
  const [riskData, setRiskData] = useState([]);
  const [marketTrends, setMarketTrends] = useState([]);
  const [portfolioPerformance, setPortfolioPerformance] = useState({
    totalInvested: 0,
    totalReturns: 0,
    activeInvestments: 0,
    averageInterestRate: 0,
    riskDistribution: []
  });

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      setLoading(true);
      try {
        // In a real app, you would fetch this data from your backend
        // For demo purposes, we'll use sample data
        
        // Sample loan data
        const sampleLoanData = [
          { month: 'Jan', borrowing: 4000, lending: 2400 },
          { month: 'Feb', borrowing: 3000, lending: 1398 },
          { month: 'Mar', borrowing: 2000, lending: 9800 },
          { month: 'Apr', borrowing: 2780, lending: 3908 },
          { month: 'May', borrowing: 1890, lending: 4800 },
          { month: 'Jun', borrowing: 2390, lending: 3800 },
        ];
        setLoanData(sampleLoanData);
        
        // Sample risk data
        const sampleRiskData = [
          { name: 'Low Risk', value: 60 },
          { name: 'Medium Risk', value: 30 },
          { name: 'High Risk', value: 10 },
        ];
        setRiskData(sampleRiskData);
        
        // Sample market trends
        const sampleMarketTrends = [
          { month: 'Jan', averageInterestRate: 5.2, loanVolume: 120000 },
          { month: 'Feb', averageInterestRate: 5.4, loanVolume: 150000 },
          { month: 'Mar', averageInterestRate: 5.3, loanVolume: 180000 },
          { month: 'Apr', averageInterestRate: 5.5, loanVolume: 200000 },
          { month: 'May', averageInterestRate: 5.7, loanVolume: 220000 },
          { month: 'Jun', averageInterestRate: 5.8, loanVolume: 250000 },
        ];
        setMarketTrends(sampleMarketTrends);
        
        // Sample portfolio performance
        const samplePortfolioPerformance = {
          totalInvested: 25000,
          totalReturns: 28750,
          activeInvestments: 12,
          averageInterestRate: 7.5,
          riskDistribution: [
            { name: 'Low Risk', value: 15000 },
            { name: 'Medium Risk', value: 8000 },
            { name: 'High Risk', value: 2000 },
          ]
        };
        setPortfolioPerformance(samplePortfolioPerformance);
        
      } catch (error) {
        console.error('Error fetching analytics data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, []);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const renderLoanActivity = () => (
    <Box>
      <Typography variant="h6" gutterBottom>Loan Activity</Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Monthly borrowing and lending activity over the past 6 months.
      </Typography>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={loanData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip formatter={(value) => formatCurrency(value)} />
          <Legend />
          <Bar dataKey="borrowing" name="Borrowing" fill="#8884d8" />
          <Bar dataKey="lending" name="Lending" fill="#82ca9d" />
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );

  const renderRiskAssessment = () => (
    <Box>
      <Typography variant="h6" gutterBottom>Risk Distribution</Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Distribution of loans by risk category.
      </Typography>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={riskData}
            cx="50%"
            cy="50%"
            labelLine={true}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {riskData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => `${value}%`} />
        </PieChart>
      </ResponsiveContainer>
    </Box>
  );

  const renderMarketTrends = () => (
    <Box>
      <Typography variant="h6" gutterBottom>Market Trends</Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Average interest rates and loan volumes over time.
      </Typography>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={marketTrends}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
          <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
          <Tooltip />
          <Legend />
          <Bar yAxisId="left" dataKey="averageInterestRate" name="Avg. Interest Rate (%)" fill="#8884d8" />
          <Bar yAxisId="right" dataKey="loanVolume" name="Loan Volume ($)" fill="#82ca9d" />
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );

  const renderPortfolioPerformance = () => (
    <Box>
      <Typography variant="h6" gutterBottom>Portfolio Performance</Typography>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={2} sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">Total Invested</Typography>
            <Typography variant="h6">{formatCurrency(portfolioPerformance.totalInvested)}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={2} sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">Total Returns</Typography>
            <Typography variant="h6">{formatCurrency(portfolioPerformance.totalReturns)}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={2} sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">Active Investments</Typography>
            <Typography variant="h6">{portfolioPerformance.activeInvestments}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={2} sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">Avg. Interest Rate</Typography>
            <Typography variant="h6">{portfolioPerformance.averageInterestRate}%</Typography>
          </Paper>
        </Grid>
      </Grid>
      
      <Typography variant="subtitle2" gutterBottom>Investment by Risk Category</Typography>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={portfolioPerformance.riskDistribution}
            cx="50%"
            cy="50%"
            labelLine={true}
            label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {portfolioPerformance.riskDistribution.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => formatCurrency(value)} />
        </PieChart>
      </ResponsiveContainer>
    </Box>
  );

  return (
    <Container>
      <Typography variant="h4" component="h1" gutterBottom>
        Analytics & Insights
      </Typography>
      
      {!isAuthenticated ? (
        <Alert severity="info" sx={{ mb: 3 }}>
          Please connect your wallet to view personalized analytics.
        </Alert>
      ) : null}
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ width: '100%' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="analytics tabs">
              <Tab label="Loan Activity" />
              <Tab label="Risk Assessment" />
              <Tab label="Market Trends" />
              <Tab label="Portfolio Performance" />
            </Tabs>
          </Box>
          
          <Box sx={{ p: 1 }}>
            {tabValue === 0 && renderLoanActivity()}
            {tabValue === 1 && renderRiskAssessment()}
            {tabValue === 2 && renderMarketTrends()}
            {tabValue === 3 && renderPortfolioPerformance()}
          </Box>
        </Box>
      )}
      
      <Box sx={{ mt: 6 }}>
        <Typography variant="h5" gutterBottom>Recommendations</Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card elevation={2}>
              <CardHeader title="Diversify Your Portfolio" />
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  Based on your current investments, we recommend diversifying across different risk categories to optimize returns while managing risk.
                </Typography>
                <Button variant="outlined" sx={{ mt: 2 }}>View Opportunities</Button>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card elevation={2}>
              <CardHeader title="Increase Low-Risk Investments" />
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  Your portfolio has a higher proportion of high-risk loans. Consider balancing with more low-risk investments for stability.
                </Typography>
                <Button variant="outlined" sx={{ mt: 2 }}>Browse Low-Risk Loans</Button>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card elevation={2}>
              <CardHeader title="Optimize Interest Returns" />
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  Current market trends show increasing interest rates. Consider refinancing existing loans to take advantage of better rates.
                </Typography>
                <Button variant="outlined" sx={{ mt: 2 }}>Refinancing Options</Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
}

export default Analytics;
