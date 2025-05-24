import React, { useState } from 'react';
import { 
  Typography, 
  Box, 
  Grid, 
  Container, 
  Card, 
  CardContent, 
  Button, 
  Chip,
  Avatar,
  Divider,
  useTheme,
  alpha,
  styled,
  Paper,
  TextField,
  InputAdornment,
  IconButton,
  Tabs,
  Tab,
  Stack
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import SortIcon from '@mui/icons-material/Sort';
import StarIcon from '@mui/icons-material/Star';
import VerifiedIcon from '@mui/icons-material/Verified';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import GridViewIcon from '@mui/icons-material/GridView';
import ViewListIcon from '@mui/icons-material/ViewList';
import { useNavigate } from 'react-router-dom';

// Styled components
const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[4],
  }
}));

const StyledTabs = styled(Tabs)(({ theme }) => ({
  '& .MuiTabs-indicator': {
    backgroundColor: theme.palette.primary.main,
    height: 3,
    borderRadius: '3px 3px 0 0',
  },
}));

const StyledTab = styled(Tab)(({ theme }) => ({
  textTransform: 'none',
  fontWeight: 500,
  fontSize: '0.875rem',
  marginRight: theme.spacing(4),
  '&.Mui-selected': {
    color: theme.palette.primary.main,
    fontWeight: 600,
  },
  '&.Mui-focusVisible': {
    backgroundColor: alpha(theme.palette.primary.main, 0.1),
  },
}));

const FilterButton = styled(Button)(({ theme, active }) => ({
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(0.75, 2),
  backgroundColor: active ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
  color: active ? theme.palette.primary.main : theme.palette.text.primary,
  border: active ? `1px solid ${theme.palette.primary.main}` : `1px solid ${alpha(theme.palette.divider, 0.5)}`,
  '&:hover': {
    backgroundColor: active ? alpha(theme.palette.primary.main, 0.15) : alpha(theme.palette.divider, 0.1),
    border: active ? `1px solid ${theme.palette.primary.main}` : `1px solid ${alpha(theme.palette.divider, 0.7)}`,
  }
}));

const ViewToggleButton = styled(IconButton)(({ theme, active }) => ({
  color: active ? theme.palette.primary.main : theme.palette.text.secondary,
  backgroundColor: active ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
  '&:hover': {
    backgroundColor: active ? alpha(theme.palette.primary.main, 0.15) : alpha(theme.palette.divider, 0.1),
  }
}));

function LoanMarketplace() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [viewMode, setViewMode] = useState('grid');
  const [activeFilters, setActiveFilters] = useState(['all']);
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  const toggleFilter = (filter) => {
    if (filter === 'all') {
      setActiveFilters(['all']);
    } else {
      const newFilters = activeFilters.filter(f => f !== 'all');
      if (newFilters.includes(filter)) {
        if (newFilters.length === 1) {
          setActiveFilters(['all']);
        } else {
          setActiveFilters(newFilters.filter(f => f !== filter));
        }
      } else {
        setActiveFilters([...newFilters, filter]);
      }
    }
  };
  
  // Mock loan listings data
  const loanListings = [
    {
      id: 'L001',
      borrower: 'Alex M.',
      amount: '2.5 ETH',
      term: '6 months',
      interest: '8.5%',
      purpose: 'Business Expansion',
      reputation: 4.8,
      status: 'Open',
      funded: 35,
      verified: true,
      category: 'business'
    },
    {
      id: 'L002',
      borrower: 'Sarah K.',
      amount: '1.2 ETH',
      term: '3 months',
      interest: '7.2%',
      purpose: 'Education Expenses',
      reputation: 4.5,
      status: 'Open',
      funded: 65,
      verified: true,
      category: 'education'
    },
    {
      id: 'L003',
      borrower: 'Michael T.',
      amount: '3.0 ETH',
      term: '12 months',
      interest: '9.0%',
      purpose: 'Debt Consolidation',
      reputation: 4.2,
      status: 'Open',
      funded: 20,
      verified: false,
      category: 'debt'
    },
    {
      id: 'L004',
      borrower: 'Jessica R.',
      amount: '0.8 ETH',
      term: '4 months',
      interest: '6.8%',
      purpose: 'Medical Expenses',
      reputation: 4.9,
      status: 'Open',
      funded: 80,
      verified: true,
      category: 'personal'
    },
    {
      id: 'L005',
      borrower: 'David L.',
      amount: '1.5 ETH',
      term: '9 months',
      interest: '8.0%',
      purpose: 'Home Improvement',
      reputation: 4.6,
      status: 'Open',
      funded: 45,
      verified: true,
      category: 'personal'
    },
    {
      id: 'L006',
      borrower: 'Emma S.',
      amount: '2.2 ETH',
      term: '6 months',
      interest: '7.5%',
      purpose: 'Startup Funding',
      reputation: 4.7,
      status: 'Open',
      funded: 55,
      verified: false,
      category: 'business'
    }
  ];
  
  // Filter loans based on active filters
  const filteredLoans = loanListings.filter(loan => {
    if (activeFilters.includes('all')) return true;
    return activeFilters.includes(loan.category);
  });
  
  return (
    <Container>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Loan Marketplace
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Browse available loan requests from borrowers or list your own loan request.
        </Typography>
      </Box>
      
      <Paper sx={{ p: 2, mb: 4, borderRadius: theme.shape.borderRadius * 1.5 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search loans by keyword, borrower, or purpose"
              variant="outlined"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              }}
              sx={{ 
                '& .MuiOutlinedInput-root': {
                  borderRadius: theme.shape.borderRadius * 1.5,
                }
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' }, flexWrap: 'wrap', gap: 1 }}>
              <FilterButton 
                startIcon={<FilterListIcon />}
                active={activeFilters.includes('all')}
                onClick={() => toggleFilter('all')}
              >
                All
              </FilterButton>
              <FilterButton 
                active={activeFilters.includes('business')}
                onClick={() => toggleFilter('business')}
              >
                Business
              </FilterButton>
              <FilterButton 
                active={activeFilters.includes('education')}
                onClick={() => toggleFilter('education')}
              >
                Education
              </FilterButton>
              <FilterButton 
                active={activeFilters.includes('personal')}
                onClick={() => toggleFilter('personal')}
              >
                Personal
              </FilterButton>
              <FilterButton 
                active={activeFilters.includes('debt')}
                onClick={() => toggleFilter('debt')}
              >
                Debt
              </FilterButton>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <StyledTabs value={tabValue} onChange={handleTabChange} aria-label="loan marketplace tabs">
            <StyledTab label="Open Loans" />
            <StyledTab label="Funded Loans" />
            <StyledTab label="My Investments" />
          </StyledTabs>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button 
            startIcon={<SortIcon />}
            variant="text"
            color="inherit"
            sx={{ mr: 1 }}
          >
            Sort
          </Button>
          <Divider orientation="vertical" flexItem sx={{ height: 24, mx: 1 }} />
          <ViewToggleButton 
            active={viewMode === 'grid'}
            onClick={() => setViewMode('grid')}
            size="small"
          >
            <GridViewIcon />
          </ViewToggleButton>
          <ViewToggleButton 
            active={viewMode === 'list'}
            onClick={() => setViewMode('list')}
            size="small"
          >
            <ViewListIcon />
          </ViewToggleButton>
        </Box>
      </Box>
      
      {tabValue === 0 && (
        <>
          {viewMode === 'grid' ? (
            <Grid container spacing={3}>
              {filteredLoans.map((loan) => (
                <Grid item xs={12} sm={6} md={4} key={loan.id}>
                  <StyledCard elevation={2}>
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar 
                            sx={{ 
                              bgcolor: alpha(theme.palette.primary.main, 0.1),
                              color: theme.palette.primary.main,
                              mr: 1.5
                            }}
                          >
                            {loan.borrower.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle1" fontWeight={500}>
                              {loan.borrower}
                              {loan.verified && (
                                <VerifiedIcon 
                                  color="primary" 
                                  fontSize="small" 
                                  sx={{ ml: 0.5, verticalAlign: 'middle' }} 
                                />
                              )}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <StarIcon sx={{ color: theme.palette.warning.main, fontSize: 16, mr: 0.5 }} />
                              <Typography variant="body2" color="text.secondary">
                                {loan.reputation}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                        <Chip 
                          label={loan.category} 
                          size="small" 
                          color={
                            loan.category === 'business' ? 'primary' : 
                            loan.category === 'education' ? 'secondary' : 
                            loan.category === 'personal' ? 'success' : 'warning'
                          }
                          sx={{ fontWeight: 500 }} 
                        />
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {loan.purpose}
                      </Typography>
                      
                      <Divider sx={{ my: 2 }} />
                      
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <AccountBalanceWalletIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
                            <Typography variant="body2" color="text.secondary">
                              Amount
                            </Typography>
                          </Box>
                          <Typography variant="subtitle2" fontWeight={600}>
                            {loan.amount}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <AccessTimeIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
                            <Typography variant="body2" color="text.secondary">
                              Term
                            </Typography>
                          </Box>
                          <Typography variant="subtitle2" fontWeight={600}>
                            {loan.term}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <TrendingUpIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
                            <Typography variant="body2" color="text.secondary">
                              Interest
                            </Typography>
                          </Box>
                          <Typography variant="subtitle2" fontWeight={600} color="primary">
                            {loan.interest}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              Funded
                            </Typography>
                          </Box>
                          <Typography variant="subtitle2" fontWeight={600}>
                            {loan.funded}%
                          </Typography>
                        </Grid>
                      </Grid>
                      
                      <Box sx={{ mt: 3, position: 'relative', height: 8, bgcolor: alpha(theme.palette.primary.main, 0.1), borderRadius: 4 }}>
                        <Box 
                          sx={{ 
                            position: 'absolute', 
                            top: 0, 
                            left: 0, 
                            height: '100%', 
                            width: `${loan.funded}%`, 
                            background: 'linear-gradient(90deg, #3a86ff, #00c6ff)',
                            borderRadius: 4
                          }} 
                        />
                      </Box>
                      
                      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
                        <Button variant="outlined" color="primary" size="small">
                          Details
                        </Button>
                        <Button variant="contained" color="primary" size="small">
                          Fund Loan
                        </Button>
                      </Box>
                    </CardContent>
                  </StyledCard>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Paper elevation={2} sx={{ borderRadius: theme.shape.borderRadius * 1.5, overflow: 'hidden' }}>
              {filteredLoans.map((loan, index) => (
                <React.Fragment key={loan.id}>
                  <Box sx={{ p: 3 }}>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar 
                            sx={{ 
                              bgcolor: alpha(theme.palette.primary.main, 0.1),
                              color: theme.palette.primary.main,
                              mr: 1.5
                            }}
                          >
                            {loan.borrower.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle1" fontWeight={500}>
                              {loan.borrower}
                              {loan.verified && (
                                <VerifiedIcon 
                                  color="primary" 
                                  fontSize="small" 
                                  sx={{ ml: 0.5, verticalAlign: 'middle' }} 
                                />
                              )}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Typography variant="body2" color="text.secondary">
                                {loan.purpose}
                              </Typography>
                              <Chip 
                                label={loan.category} 
                                size="small" 
                                color={
                                  loan.category === 'business' ? 'primary' : 
                                  loan.category === 'education' ? 'secondary' : 
                                  loan.category === 'personal' ? 'success' : 'warning'
                                }
                                sx={{ fontWeight: 500, ml: 1 }} 
                              />
                            </Box>
                          </Box>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Grid container spacing={1}>
                          <Grid item xs={4}>
                            <Typography variant="body2" color="text.secondary">
                              Amount
                            </Typography>
                            <Typography variant="subtitle2" fontWeight={600}>
                              {loan.amount}
                            </Typography>
                          </Grid>
                          <Grid item xs={4}>
                            <Typography variant="body2" color="text.secondary">
                              Term
                            </Typography>
                            <Typography variant="subtitle2" fontWeight={600}>
                              {loan.term}
                            </Typography>
                          </Grid>
                          <Grid item xs={4}>
                            <Typography variant="body2" color="text.secondary">
                              Interest
                            </Typography>
                            <Typography variant="subtitle2" fontWeight={600} color="primary">
                              {loan.interest}
                            </Typography>
                          </Grid>
                        </Grid>
                      </Grid>
                      <Grid item xs={12} sm={2}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: { xs: 'flex-start', sm: 'flex-end' } }}>
                          <Typography variant="body2" color="text.secondary">
                            Funded: {loan.funded}%
                          </Typography>
                          <Box sx={{ mt: 1, position: 'relative', height: 6, width: '100%', bgcolor: alpha(theme.palette.primary.main, 0.1), borderRadius: 3 }}>
                            <Box 
                              sx={{ 
                                position: 'absolute', 
                                top: 0, 
                                left: 0, 
                                height: '100%', 
                                width: `${loan.funded}%`, 
                                background: 'linear-gradient(90deg, #3a86ff, #00c6ff)',
                                borderRadius: 3
                              }} 
                            />
                          </Box>
                        </Box>
                      </Grid>
                    </Grid>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                      <Button variant="outlined" color="primary" size="small" sx={{ mr: 1 }}>
                        Details
                      </Button>
                      <Button variant="contained" color="primary" size="small">
                        Fund Loan
                      </Button>
                    </Box>
                  </Box>
                  {index < filteredLoans.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </Paper>
          )}
          
          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Button variant="outlined" color="primary">
              Load More
            </Button>
          </Box>
        </>
      )}
      
      {tabValue === 1 && (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <Typography variant="h6" gutterBottom>
            Funded Loans
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            View loans that have been fully funded and are currently active.
          </Typography>
          <Button variant="contained" color="primary">
            Browse Funded Loans
          </Button>
        </Box>
      )}
      
      {tabValue === 2 && (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <Typography variant="h6" gutterBottom>
            My Investments
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Track the performance of loans you've invested in.
          </Typography>
          <Button variant="contained" color="primary">
            View My Investments
          </Button>
        </Box>
      )}
      
      <Paper sx={{ p: 4, mt: 6, borderRadius: theme.shape.borderRadius * 2, background: theme.palette.mode === 'light' ? 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)' : 'linear-gradient(135deg, #121212 0%, #1e1e1e 100%)' }}>
        <Grid container spacing={4} alignItems="center">
          <Grid item xs={12} md={8}>
            <Typography variant="h5" gutterBottom>
              Need a Loan?
            </Typography>
            <Typography variant="body1" paragraph>
              Create your own loan request and get funded by our community of lenders. Our AI-powered risk assessment will help you get the best rates.
            </Typography>
            <Button 
              variant="contained" 
              color="primary" 
              size="large"
              onClick={() => navigate('/apply')}
            >
              Apply for a Loan
            </Button>
          </Grid>
          <Grid item xs={12} md={4} sx={{ display: { xs: 'none', md: 'block' } }}>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center',
              position: 'relative'
            }}>
              <Box sx={{ 
                width: 150, 
                height: 150, 
                borderRadius: '50%', 
                background: 'linear-gradient(45deg, #3a86ff 0%, #00c6ff 100%)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                boxShadow: theme.shadows[4],
                color: 'white',
                fontSize: '2rem',
                fontWeight: 700
              }}>
                AI
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
}

export default LoanMarketplace;
