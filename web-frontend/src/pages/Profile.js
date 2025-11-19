import React, { useState } from 'react';
import { 
  Typography, 
  Box, 
  Paper, 
  Grid, 
  TextField, 
  Button, 
  CircularProgress,
  Alert,
  Avatar,
  Divider
} from '@mui/material';
import { useApi } from '../contexts/ApiContext';
import PersonIcon from '@mui/icons-material/Person';

const Profile = () => {
  const { user, updateProfile, updatePassword, loading, error: apiError } = useApi();
  
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    walletAddress: user?.walletAddress || ''
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [profileError, setProfileError] = useState(null);
  const [passwordError, setPasswordError] = useState(null);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData({
      ...profileData,
      [name]: value
    });
  };
  
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData({
      ...passwordData,
      [name]: value
    });
  };
  
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(false);
    
    try {
      await updateProfile(profileData);
      setProfileSuccess(true);
    } catch (err) {
      setProfileError(err.response?.data?.message || 'Failed to update profile');
    }
  };
  
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    
    try {
      await updatePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      setPasswordSuccess(true);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err) {
      setPasswordError(err.response?.data?.message || 'Failed to update password');
    }
  };
  
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Profile
      </Typography>
      
      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                <PersonIcon />
              </Avatar>
              <Typography variant="h6">
                Account Information
              </Typography>
            </Box>
            
            {apiError && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {apiError}
              </Alert>
            )}
            
            {profileError && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {profileError}
              </Alert>
            )}
            
            {profileSuccess && (
              <Alert severity="success" sx={{ mb: 3 }}>
                Profile updated successfully!
              </Alert>
            )}
            
            <form onSubmit={handleProfileSubmit}>
              <TextField
                label="Full Name"
                name="name"
                value={profileData.name}
                onChange={handleProfileChange}
                fullWidth
                margin="normal"
                required
              />
              
              <TextField
                label="Email Address"
                name="email"
                type="email"
                value={profileData.email}
                onChange={handleProfileChange}
                fullWidth
                margin="normal"
                required
              />
              
              <TextField
                label="Wallet Address (Optional)"
                name="walletAddress"
                value={profileData.walletAddress}
                onChange={handleProfileChange}
                fullWidth
                margin="normal"
                helperText="Your Ethereum wallet address for blockchain transactions"
              />
              
              <Button
                type="submit"
                variant="contained"
                sx={{ mt: 3 }}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Update Profile'}
              </Button>
            </form>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Change Password
            </Typography>
            
            {passwordError && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {passwordError}
              </Alert>
            )}
            
            {passwordSuccess && (
              <Alert severity="success" sx={{ mb: 3 }}>
                Password updated successfully!
              </Alert>
            )}
            
            <form onSubmit={handlePasswordSubmit}>
              <TextField
                label="Current Password"
                name="currentPassword"
                type="password"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                fullWidth
                margin="normal"
                required
              />
              
              <TextField
                label="New Password"
                name="newPassword"
                type="password"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                fullWidth
                margin="normal"
                required
              />
              
              <TextField
                label="Confirm New Password"
                name="confirmPassword"
                type="password"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                fullWidth
                margin="normal"
                required
              />
              
              <Button
                type="submit"
                variant="contained"
                sx={{ mt: 3 }}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Change Password'}
              </Button>
            </form>
          </Paper>
          
          <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Account Security
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Member Since
              </Typography>
              <Typography variant="body1">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
              </Typography>
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="body2" color="text.secondary" paragraph>
              For security reasons, we recommend:
            </Typography>
            
            <ul>
              <li>
                <Typography variant="body2">
                  Use a strong, unique password
                </Typography>
              </li>
              <li>
                <Typography variant="body2">
                  Never share your private keys or wallet seed phrases
                </Typography>
              </li>
              <li>
                <Typography variant="body2">
                  Verify all transaction details before signing
                </Typography>
              </li>
            </ul>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Profile;
