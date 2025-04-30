import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Box, 
  Container, 
  Grid, 
  Paper, 
  TextField, 
  Button, 
  Alert,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Badge,
  IconButton,
  Drawer,
  Switch,
  FormControlLabel
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import EmailIcon from '@mui/icons-material/Email';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InfoIcon from '@mui/icons-material/Info';
import CloseIcon from '@mui/icons-material/Close';
import { useAuth } from '../context/AuthContext';

function Notifications() {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    loanUpdates: true,
    marketAlerts: true,
    paymentReminders: true,
    securityAlerts: true
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true);
      try {
        // In a real app, you would fetch notifications from your backend
        // For demo purposes, we'll use sample data
        const sampleNotifications = [
          {
            id: 1,
            type: 'loan_approved',
            title: 'Loan Approved',
            message: 'Your loan application for $5,000 has been approved.',
            timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
            read: false,
            priority: 'high'
          },
          {
            id: 2,
            type: 'payment_due',
            title: 'Payment Due',
            message: 'Your loan payment of $250 is due in 3 days.',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
            read: false,
            priority: 'medium'
          },
          {
            id: 3,
            type: 'investment_return',
            title: 'Investment Return',
            message: 'You received a return of $120 from your investment in loan #1234.',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
            read: true,
            priority: 'low'
          },
          {
            id: 4,
            type: 'security_alert',
            title: 'New Device Login',
            message: 'Your account was accessed from a new device. If this wasn\'t you, please secure your account.',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
            read: true,
            priority: 'high'
          },
          {
            id: 5,
            type: 'market_alert',
            title: 'Interest Rate Change',
            message: 'Average interest rates have decreased by 0.5%. Consider refinancing your loans.',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days ago
            read: true,
            priority: 'medium'
          }
        ];
        
        setNotifications(sampleNotifications);
        setNotificationCount(sampleNotifications.filter(n => !n.read).length);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
    if (!drawerOpen) {
      // Mark all as read when opening drawer
      const updatedNotifications = notifications.map(notification => ({
        ...notification,
        read: true
      }));
      setNotifications(updatedNotifications);
      setNotificationCount(0);
    }
  };

  const handleSettingChange = (event) => {
    const { name, checked } = event.target;
    setSettings({
      ...settings,
      [name]: checked
    });
    
    setSnackbar({
      open: true,
      message: 'Notification settings updated',
      severity: 'success'
    });
  };

  const handleSnackbarClose = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };

  const handleDeleteNotification = (id) => {
    const updatedNotifications = notifications.filter(notification => notification.id !== id);
    setNotifications(updatedNotifications);
    setNotificationCount(updatedNotifications.filter(n => !n.read).length);
    
    setSnackbar({
      open: true,
      message: 'Notification deleted',
      severity: 'success'
    });
  };

  const getNotificationIcon = (type, priority) => {
    switch (type) {
      case 'loan_approved':
        return <CheckCircleIcon color="success" />;
      case 'payment_due':
        return <WarningIcon color="warning" />;
      case 'investment_return':
        return <AccountBalanceWalletIcon color="primary" />;
      case 'security_alert':
        return <WarningIcon color="error" />;
      case 'market_alert':
        return <InfoIcon color="info" />;
      default:
        return <EmailIcon />;
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    }
  };

  return (
    <Container>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1">
          Notifications
        </Typography>
        
        <IconButton 
          color="primary" 
          onClick={handleDrawerToggle}
          sx={{ position: 'relative' }}
        >
          <Badge badgeContent={notificationCount} color="error">
            <NotificationsIcon />
          </Badge>
        </IconButton>
      </Box>
      
      {!isAuthenticated ? (
        <Alert severity="info" sx={{ mb: 3 }}>
          Please connect your wallet to manage your notifications.
        </Alert>
      ) : (
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Notification Settings
              </Typography>
              
              <Box sx={{ mt: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.emailNotifications}
                      onChange={handleSettingChange}
                      name="emailNotifications"
                      color="primary"
                    />
                  }
                  label="Email Notifications"
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.pushNotifications}
                      onChange={handleSettingChange}
                      name="pushNotifications"
                      color="primary"
                    />
                  }
                  label="Push Notifications"
                />
              </Box>
              
              <Typography variant="subtitle2" sx={{ mt: 3, mb: 1 }}>
                Notification Types
              </Typography>
              
              <Box sx={{ ml: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.loanUpdates}
                      onChange={handleSettingChange}
                      name="loanUpdates"
                      color="primary"
                      size="small"
                    />
                  }
                  label="Loan Updates"
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.marketAlerts}
                      onChange={handleSettingChange}
                      name="marketAlerts"
                      color="primary"
                      size="small"
                    />
                  }
                  label="Market Alerts"
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.paymentReminders}
                      onChange={handleSettingChange}
                      name="paymentReminders"
                      color="primary"
                      size="small"
                    />
                  }
                  label="Payment Reminders"
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.securityAlerts}
                      onChange={handleSettingChange}
                      name="securityAlerts"
                      color="primary"
                      size="small"
                    />
                  }
                  label="Security Alerts"
                />
              </Box>
              
              <Box sx={{ mt: 3 }}>
                <Button variant="contained" color="primary">
                  Save Settings
                </Button>
              </Box>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Recent Notifications
              </Typography>
              
              {loading ? (
                <Typography variant="body2" sx={{ py: 2 }}>
                  Loading notifications...
                </Typography>
              ) : notifications.length > 0 ? (
                <List>
                  {notifications.slice(0, 3).map((notification) => (
                    <React.Fragment key={notification.id}>
                      <ListItem 
                        alignItems="flex-start"
                        secondaryAction={
                          <IconButton 
                            edge="end" 
                            aria-label="delete"
                            onClick={() => handleDeleteNotification(notification.id)}
                          >
                            <CloseIcon />
                          </IconButton>
                        }
                        sx={{ 
                          bgcolor: notification.read ? 'transparent' : 'rgba(25, 118, 210, 0.08)',
                          borderRadius: 1
                        }}
                      >
                        <ListItemIcon>
                          {getNotificationIcon(notification.type, notification.priority)}
                        </ListItemIcon>
                        <ListItemText
                          primary={notification.title}
                          secondary={
                            <React.Fragment>
                              <Typography
                                sx={{ display: 'inline' }}
                                component="span"
                                variant="body2"
                                color="text.primary"
                              >
                                {notification.message}
                              </Typography>
                              <Typography
                                component="span"
                                variant="body2"
                                color="text.secondary"
                                sx={{ display: 'block', mt: 0.5 }}
                              >
                                {formatTimestamp(notification.timestamp)}
                              </Typography>
                            </React.Fragment>
                          }
                        />
                      </ListItem>
                      <Divider component="li" />
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" sx={{ py: 2 }}>
                  No notifications to display.
                </Typography>
              )}
              
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Button 
                  variant="outlined" 
                  color="primary"
                  onClick={handleDrawerToggle}
                >
                  View All Notifications
                </Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}
      
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={handleDrawerToggle}
      >
        <Box
          sx={{ width: 320, p: 2 }}
          role="presentation"
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">All Notifications</Typography>
            <IconButton onClick={handleDrawerToggle}>
              <CloseIcon />
            </IconButton>
          </Box>
          
          <Divider sx={{ mb: 2 }} />
          
          {notifications.length > 0 ? (
            <List>
              {notifications.map((notification) => (
                <React.Fragment key={notification.id}>
                  <ListItem 
                    alignItems="flex-start"
                    secondaryAction={
                      <IconButton 
                        edge="end" 
                        aria-label="delete"
                        onClick={() => handleDeleteNotification(notification.id)}
                      >
                        <CloseIcon />
                      </IconButton>
                    }
                    sx={{ 
                      bgcolor: notification.read ? 'transparent' : 'rgba(25, 118, 210, 0.08)',
                      borderRadius: 1
                    }}
                  >
                    <ListItemIcon>
                      {getNotificationIcon(notification.type, notification.priority)}
                    </ListItemIcon>
                    <ListItemText
                      primary={notification.title}
                      secondary={
                        <React.Fragment>
                          <Typography
                            sx={{ display: 'inline' }}
                            component="span"
                            variant="body2"
                            color="text.primary"
                          >
                            {notification.message}
                          </Typography>
                          <Typography
                            component="span"
                            variant="body2"
                            color="text.secondary"
                            sx={{ display: 'block', mt: 0.5 }}
                          >
                            {formatTimestamp(notification.timestamp)}
                          </Typography>
                        </React.Fragment>
                      }
                    />
                  </ListItem>
                  <Divider component="li" />
                </React.Fragment>
              ))}
            </List>
          ) : (
            <Typography variant="body2" sx={{ py: 2, textAlign: 'center' }}>
              No notifications to display.
            </Typography>
          )}
        </Box>
      </Drawer>
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        message={snackbar.message}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default Notifications;
