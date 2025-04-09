import React, { useState } from 'react';
import { styled, alpha } from '@mui/material/styles';
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
  MenuItem,
  Tooltip,
  Badge,
  ListItemButton
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
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import CloseIcon from '@mui/icons-material/Close';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useThemeMode } from '../theme/ThemeContext';

// Styled components
const StyledAppBar = styled(AppBar)(({ theme }) => ({
  transition: 'all 0.3s ease',
  boxShadow: theme.shadows[2],
  backdropFilter: 'blur(10px)',
  backgroundColor: theme.palette.mode === 'light' 
    ? 'rgba(255, 255, 255, 0.8)' 
    : 'rgba(18, 18, 18, 0.8)',
  color: theme.palette.text.primary,
}));

const LogoText = styled(Typography)(({ theme }) => ({
  fontFamily: 'Poppins, sans-serif',
  fontWeight: 600,
  fontSize: '1.5rem',
  background: theme.palette.mode === 'light' 
    ? 'linear-gradient(45deg, #3a86ff 0%, #00c6ff 100%)' 
    : 'linear-gradient(45deg, #3a86ff 30%, #00c6ff 90%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
  textFillColor: 'transparent',
  display: 'flex',
  alignItems: 'center',
}));

const NavButton = styled(Button)(({ theme, active }) => ({
  borderRadius: theme.shape.borderRadius,
  margin: theme.spacing(0, 1),
  padding: theme.spacing(1, 2),
  color: theme.palette.text.primary,
  position: 'relative',
  overflow: 'hidden',
  '&:after': {
    content: '""',
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: active ? '100%' : '0%',
    height: '3px',
    background: 'linear-gradient(45deg, #3a86ff 0%, #00c6ff 100%)',
    transition: 'width 0.3s ease',
  },
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.08),
    '&:after': {
      width: '100%',
    },
  },
}));

const DrawerHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(2),
}));

const StyledListItemButton = styled(ListItemButton)(({ theme, active }) => ({
  borderRadius: theme.shape.borderRadius,
  margin: theme.spacing(0.5, 1),
  backgroundColor: active ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.08),
  },
  '& .MuiListItemIcon-root': {
    color: active ? theme.palette.primary.main : theme.palette.text.secondary,
  },
  '& .MuiListItemText-primary': {
    color: active ? theme.palette.primary.main : theme.palette.text.primary,
    fontWeight: active ? 500 : 400,
  },
}));

const StyledFooter = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  backgroundColor: theme.palette.mode === 'light' 
    ? alpha(theme.palette.background.paper, 0.8)
    : alpha(theme.palette.background.paper, 0.2),
  backdropFilter: 'blur(10px)',
  borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  marginTop: 'auto',
}));

// Navigation items
const navItems = [
  { name: 'Home', path: '/', icon: <HomeIcon /> },
  { name: 'Apply for Loan', path: '/apply', icon: <AccountBalanceIcon /> },
  { name: 'Marketplace', path: '/marketplace', icon: <CurrencyExchangeIcon /> },
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
  const { mode, toggleColorMode } = useThemeMode();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const location = useLocation();

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

  const isActive = (path) => {
    return location.pathname === path;
  };

  const drawer = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <DrawerHeader>
        <LogoText variant="h6">
          LendSmart
        </LogoText>
        <IconButton onClick={handleDrawerToggle} edge="end">
          <CloseIcon />
        </IconButton>
      </DrawerHeader>
      <Divider />
      <List sx={{ flexGrow: 1, px: 1 }}>
        {navItems.map((item) => (
          <ListItem key={item.name} disablePadding>
            <StyledListItemButton
              component={RouterLink}
              to={item.path}
              active={isActive(item.path)}
              onClick={handleDrawerToggle}
            >
              <ListItemIcon>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.name} />
            </StyledListItemButton>
          </ListItem>
        ))}
        
        {isAuthenticated && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="overline" sx={{ px: 3, color: 'text.secondary', fontWeight: 500 }}>
              Account
            </Typography>
            {authItems.map((item) => (
              <ListItem key={item.name} disablePadding>
                <StyledListItemButton
                  component={RouterLink}
                  to={item.path}
                  active={isActive(item.path)}
                  onClick={handleDrawerToggle}
                >
                  <ListItemIcon>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.name} />
                  {item.name === 'Notifications' && (
                    <Badge color="error" variant="dot" />
                  )}
                </StyledListItemButton>
              </ListItem>
            ))}
          </>
        )}
      </List>
      
      <Box sx={{ p: 2 }}>
        <Button
          fullWidth
          variant={isAuthenticated ? "outlined" : "contained"}
          color="primary"
          onClick={isAuthenticated ? handleDisconnect : connectWallet}
          sx={{ mb: 2 }}
        >
          {isAuthenticated ? 'Disconnect Wallet' : 'Connect Wallet'}
        </Button>
        <Button
          fullWidth
          variant="outlined"
          color="inherit"
          onClick={toggleColorMode}
          startIcon={mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
        >
          {mode === 'dark' ? 'Light Mode' : 'Dark Mode'}
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <StyledAppBar position="sticky" elevation={0}>
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
          
          <LogoText
            variant="h6"
            component={RouterLink}
            to="/"
            sx={{ 
              flexGrow: 1, 
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            LendSmart
          </LogoText>
          
          {!isMobile && (
            <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
              {navItems.map((item) => (
                <NavButton 
                  key={item.name} 
                  component={RouterLink} 
                  to={item.path} 
                  active={isActive(item.path) ? 1 : 0}
                >
                  {item.name}
                </NavButton>
              ))}
            </Box>
          )}
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Tooltip title={mode === 'dark' ? 'Light Mode' : 'Dark Mode'}>
              <IconButton onClick={toggleColorMode} color="inherit" sx={{ mr: 1 }}>
                {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
              </IconButton>
            </Tooltip>
            
            {isAuthenticated ? (
              <>
                <Tooltip title="Notifications">
                  <IconButton color="inherit" component={RouterLink} to="/notifications" sx={{ mr: 1 }}>
                    <Badge badgeContent={3} color="error">
                      <NotificationsIcon />
                    </Badge>
                  </IconButton>
                </Tooltip>
                
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
                    borderColor: alpha(theme.palette.divider, 0.5),
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.08),
                    },
                  }}
                  onClick={handleProfileMenuOpen}
                />
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleProfileMenuClose}
                  PaperProps={{
                    elevation: 3,
                    sx: {
                      borderRadius: 2,
                      minWidth: 180,
                    }
                  }}
                  transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                  anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                >
                  <MenuItem component={RouterLink} to="/profile" onClick={handleProfileMenuClose}>
                    <ListItemIcon>
                      <PersonIcon fontSize="small" />
                    </ListItemIcon>
                    Profile
                  </MenuItem>
                  <MenuItem component={RouterLink} to="/dashboard" onClick={handleProfileMenuClose}>
                    <ListItemIcon>
                      <DashboardIcon fontSize="small" />
                    </ListItemIcon>
                    Dashboard
                  </MenuItem>
                  <Divider />
                  <MenuItem onClick={handleDisconnect}>
                    <ListItemIcon>
                      <CloseIcon fontSize="small" />
                    </ListItemIcon>
                    Disconnect Wallet
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <Button 
                variant="contained" 
                color="primary" 
                onClick={connectWallet}
                sx={{ 
                  px: 3,
                  py: 1,
                }}
              >
                Connect Wallet
              </Button>
            )}
          </Box>
        </Toolbar>
      </StyledAppBar>
      
      <Drawer
        variant="temporary"
        open={drawerOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile
        }}
        PaperProps={{
          sx: {
            width: 280,
            borderRadius: 0,
          }
        }}
      >
        {drawer}
      </Drawer>
      
      <Box component="main" sx={{ flexGrow: 1, py: 3 }}>
        <Container maxWidth="lg">
          {children}
        </Container>
      </Box>
      
      <StyledFooter component="footer">
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'center', md: 'flex-start' } }}>
            <Box sx={{ mb: { xs: 3, md: 0 }, textAlign: { xs: 'center', md: 'left' } }}>
              <LogoText variant="h6" sx={{ mb: 1 }}>
                LendSmart
              </LogoText>
              <Typography variant="body2" color="text.secondary">
                AI-powered P2P lending platform with blockchain integration
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 4, textAlign: { xs: 'center', sm: 'left' } }}>
              <Box>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  Platform
                </Typography>
                <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0 }}>
                  {navItems.map((item) => (
                    <Box component="li" key={item.name} sx={{ mb: 1 }}>
                      <Typography 
                        component={RouterLink} 
                        to={item.path}
                        variant="body2" 
                        color="text.secondary"
                        sx={{ 
                          textDecoration: 'none',
                          '&:hover': { color: 'primary.main' },
                          transition: 'color 0.2s',
                        }}
                      >
                        {item.name}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
              
              <Box>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  Resources
                </Typography>
                <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0 }}>
                  <Box component="li" sx={{ mb: 1 }}>
                    <Typography 
                      component="a" 
                      href="#"
                      variant="body2" 
                      color="text.secondary"
                      sx={{ 
                        textDecoration: 'none',
                        '&:hover': { color: 'primary.main' },
                        transition: 'color 0.2s',
                      }}
                    >
                      Documentation
                    </Typography>
                  </Box>
                  <Box component="li" sx={{ mb: 1 }}>
                    <Typography 
                      component="a" 
                      href="#"
                      variant="body2" 
                      color="text.secondary"
                      sx={{ 
                        textDecoration: 'none',
                        '&:hover': { color: 'primary.main' },
                        transition: 'color 0.2s',
                      }}
                    >
                      FAQ
                    </Typography>
                  </Box>
                  <Box component="li" sx={{ mb: 1 }}>
                    <Typography 
                      component="a" 
                      href="#"
                      variant="body2" 
                      color="text.secondary"
                      sx={{ 
                        textDecoration: 'none',
                        '&:hover': { color: 'primary.main' },
                        transition: 'color 0.2s',
                      }}
                    >
                      Support
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>
          
          <Divider sx={{ my: 3 }} />
          
          <Typography variant="body2" color="text.secondary" align="center">
            © {new Date().getFullYear()} LendSmart. All rights reserved.
          </Typography>
        </Container>
      </StyledFooter>
    </Box>
  );
}

export default Layout;
