import React, { useState } from 'react';
import { 
  AppBar, 
  Box, 
  Toolbar, 
  Typography, 
  Button, 
  IconButton, 
  Drawer, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemIcon, 
  Divider, 
  Container, 
  useTheme, 
  useMediaQuery,
  Avatar,
  Chip,
  Menu,
  MenuItem
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import HomeIcon from '@mui/icons-material/Home';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import PersonIcon from '@mui/icons-material/Person';
import BarChartIcon from '@mui/icons-material/BarChart';
import NotificationsIcon from '@mui/icons-material/Notifications';
import CurrencyExchangeIcon from '@mui/icons-material/CurrencyExchange';
import StarIcon from '@mui/icons-material/Star';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Navigation items
const navItems = [
  { name: 'Home', path: '/' },
  { name: 'Apply for Loan', path: '/apply' },
  { name: 'Marketplace', path: '/marketplace' },
];

// Auth items
const authItems = [
  { name: 'Dashboard', path: '/dashboard', icon: <DashboardIcon /> },
  { name: 'Analytics', path: '/analytics', icon: <BarChartIcon /> },
  { name: 'Notifications', path: '/notifications', icon: <NotificationsIcon /> },
  { name: 'Multi-Currency', path: '/multi-currency', icon: <CurrencyExchangeIcon /> },
  { name: 'Reputation', path: '/reputation', icon: <StarIcon /> },
  { name: 'Profile', path: '/profile', icon: <PersonIcon /> },
];

function Layout({ children }) {
  const { isAuthenticated, userProfile, connectWallet, disconnectWallet } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDisconnect = () => {
    disconnectWallet();
    handleProfileMenuClose();
  };

  const drawer = (
    <Box sx={{ width: 250 }} role="presentation" onClick={handleDrawerToggle}>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="h6" component="div">
          LendSmart
        </Typography>
      </Box>
      <Divider />
      <List>
        {navItems.map((item) => (
          <ListItem 
            button 
            key={item.name} 
            component={RouterLink} 
            to={item.path}
          >
            <ListItemIcon>
              {item.name === 'Home' ? <HomeIcon /> : <AccountBalanceIcon />}
            </ListItemIcon>
            <ListItemText primary={item.name} />
          </ListItem>
        ))}
      </List>
      {isAuthenticated && (
        <>
          <Divider />
          <List>
            {authItems.map((item) => (
              <ListItem 
                button 
                key={item.name} 
                component={RouterLink} 
                to={item.path}
              >
                <ListItemIcon>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.name} />
              </ListItem>
            ))}
          </List>
        </>
      )}
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          
          <Typography
            variant="h6"
            component={RouterLink}
            to="/"
            sx={{ 
              flexGrow: 1, 
              textDecoration: 'none', 
              color: 'inherit',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            LendSmart
          </Typography>
          
          {!isMobile && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {navItems.map((item) => (
                <Button 
                  key={item.name} 
                  component={RouterLink} 
                  to={item.path} 
                  sx={{ color: 'white', mx: 1 }}
                >
                  {item.name}
                </Button>
              ))}
            </Box>
          )}
          
          <Box sx={{ ml: 2 }}>
            {isAuthenticated ? (
              <>
                <Chip
                  avatar={
                    <Avatar 
                      sx={{ 
                        bgcolor: theme.palette.secondary.main,
                        cursor: 'pointer'
                      }}
                      onClick={handleProfileMenuOpen}
                    >
                      {userProfile?.shortAddress?.charAt(0) || 'U'}
                    </Avatar>
                  }
                  label={userProfile?.shortAddress || '0x...'}
                  variant="outlined"
                  sx={{ 
                    color: 'white', 
                    borderColor: 'rgba(255,255,255,0.5)',
                    cursor: 'pointer'
                  }}
                  onClick={handleProfileMenuOpen}
                />
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleProfileMenuClose}
                >
                  <MenuItem component={RouterLink} to="/profile" onClick={handleProfileMenuClose}>
                    Profile
                  </MenuItem>
                  <MenuItem component={RouterLink} to="/dashboard" onClick={handleProfileMenuClose}>
                    Dashboard
                  </MenuItem>
                  <Divider />
                  <MenuItem onClick={handleDisconnect}>Disconnect Wallet</MenuItem>
                </Menu>
              </>
            ) : (
              <Button 
                variant="outlined" 
                color="inherit" 
                onClick={connectWallet}
              >
                Connect Wallet
              </Button>
            )}
          </Box>
        </Toolbar>
      </AppBar>
      
      <Drawer
        variant="temporary"
        open={drawerOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile
        }}
      >
        {drawer}
      </Drawer>
      
      <Box component="main" sx={{ flexGrow: 1, py: 3 }}>
        <Container>
          {children}
        </Container>
      </Box>
      
      <Box component="footer" sx={{ py: 3, bgcolor: 'background.paper', mt: 'auto' }}>
        <Container maxWidth="lg">
          <Typography variant="body2" color="text.secondary" align="center">
            © {new Date().getFullYear()} LendSmart. All rights reserved.
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
            AI-powered P2P lending platform with blockchain integration
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}

export default Layout;
