import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Box, 
  Container, 
  Grid, 
  Paper, 
  TextField, 
  Button, 
  Avatar,
  Divider,
  CircularProgress,
  Alert
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { ethers } from 'ethers';

function Profile() {
  const { userProfile, isAuthenticated, connectWallet } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    occupation: '',
    bio: ''
  });

  useEffect(() => {
    // In a real app, you would fetch the user's profile from your backend
    // For demo purposes, we'll use placeholder data
    if (isAuthenticated && userProfile) {
      setProfileData({
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+1 (555) 123-4567',
        occupation: 'Software Developer',
        bio: 'Blockchain enthusiast and early adopter of decentralized finance solutions.'
      });
    }
  }, [isAuthenticated, userProfile]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData({
      ...profileData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      connectWallet();
      return;
    }
    
    setLoading(true);
    setSuccess(false);
    setError(null);
    
    try {
      // In a real app, you would send the updated profile to your backend
      // For demo purposes, we'll simulate a successful update
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSuccess(true);
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <Typography variant="h4" component="h1" gutterBottom>
        Profile
      </Typography>
      
      {!isAuthenticated ? (
        <Paper elevation={2} sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            Connect Your Wallet
          </Typography>
          <Typography variant="body1" paragraph>
            You need to connect your wallet to view and edit your profile.
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={connectWallet}
          >
            Connect Wallet
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Paper elevation={2} sx={{ p: 3, textAlign: 'center' }}>
              <Avatar 
                sx={{ 
                  width: 120, 
                  height: 120, 
                  mx: 'auto', 
                  mb: 2,
                  bgcolor: 'primary.main'
                }}
              >
                {profileData.name.charAt(0)}
              </Avatar>
              
              <Typography variant="h6" gutterBottom>
                {profileData.name || 'Anonymous User'}
              </Typography>
              
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {userProfile?.shortAddress || userProfile?.address}
              </Typography>
              
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Wallet Balance
                </Typography>
                <Typography variant="h6">
                  {userProfile?.balance ? 
                    `${parseFloat(ethers.utils.formatEther(userProfile.balance)).toFixed(4)} ETH` : 
                    '0 ETH'}
                </Typography>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ textAlign: 'left' }}>
                <Typography variant="subtitle2" gutterBottom>
                  Account Status
                </Typography>
                <Typography variant="body2" paragraph>
                  Verified: Yes
                </Typography>
                
                <Typography variant="subtitle2" gutterBottom>
                  Member Since
                </Typography>
                <Typography variant="body2">
                  {new Date().toLocaleDateString()}
                </Typography>
              </Box>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={8}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Personal Information
              </Typography>
              
              {success && (
                <Alert severity="success" sx={{ mb: 3 }}>
                  Profile updated successfully!
                </Alert>
              )}
              
              {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error}
                </Alert>
              )}
              
              <Box component="form" onSubmit={handleSubmit}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Full Name"
                      name="name"
                      value={profileData.name}
                      onChange={handleInputChange}
                      margin="normal"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Email"
                      name="email"
                      type="email"
                      value={profileData.email}
                      onChange={handleInputChange}
                      margin="normal"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Phone Number"
                      name="phone"
                      value={profileData.phone}
                      onChange={handleInputChange}
                      margin="normal"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Occupation"
                      name="occupation"
                      value={profileData.occupation}
                      onChange={handleInputChange}
                      margin="normal"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Bio"
                      name="bio"
                      multiline
                      rows={4}
                      value={profileData.bio}
                      onChange={handleInputChange}
                      margin="normal"
                    />
                  </Grid>
                </Grid>
                
                <Box sx={{ mt: 3, textAlign: 'right' }}>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={loading}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Save Changes'}
                  </Button>
                </Box>
              </Box>
            </Paper>
            
            <Paper elevation={2} sx={{ p: 3, mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Security Settings
              </Typography>
              
              <Box sx={{ mt: 2 }}>
                <Button variant="outlined" color="primary" sx={{ mr: 2 }}>
                  Change Password
                </Button>
                <Button variant="outlined" color="secondary">
                  Enable 2FA
                </Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Container>
  );
}

export default Profile;
