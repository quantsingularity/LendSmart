import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Box, 
  Container, 
  Grid, 
  Paper, 
  TextField, 
  Button, 
  Rating,
  Avatar,
  Card,
  CardContent,
  CardHeader,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Chip,
  CircularProgress,
  Alert
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import PersonIcon from '@mui/icons-material/Person';
import StarIcon from '@mui/icons-material/Star';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SecurityIcon from '@mui/icons-material/Security';

function Reputation() {
  const { isAuthenticated, userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [userReputation, setUserReputation] = useState({
    score: 0,
    level: '',
    badges: [],
    history: [],
    reviews: []
  });
  const [endorsement, setEndorsement] = useState('');
  const [topUsers, setTopUsers] = useState([]);

  useEffect(() => {
    const fetchReputationData = async () => {
      setLoading(true);
      try {
        // In a real app, you would fetch this data from your backend
        // For demo purposes, we'll use sample data
        
        // Sample user reputation data
        const sampleUserReputation = {
          score: 87,
          level: 'Trusted',
          badges: [
            { id: 1, name: 'Verified User', icon: 'verified', description: 'Identity verified through KYC process' },
            { id: 2, name: 'Timely Repayer', icon: 'payment', description: 'Has repaid 5+ loans on time' },
            { id: 3, name: 'Active Investor', icon: 'investment', description: 'Has funded 10+ loans' }
          ],
          history: [
            { id: 1, date: '2025-03-15', action: 'Loan Repaid', points: 10, description: 'Repaid loan #1234 on time' },
            { id: 2, date: '2025-02-28', action: 'Loan Funded', points: 5, description: 'Funded loan #5678' },
            { id: 3, date: '2025-02-10', action: 'Identity Verified', points: 20, description: 'Completed KYC verification' },
            { id: 4, date: '2025-01-25', action: 'Loan Repaid', points: 10, description: 'Repaid loan #9012 on time' },
            { id: 5, date: '2025-01-05', action: 'Account Created', points: 5, description: 'Joined LendSmart platform' }
          ],
          reviews: [
            { id: 1, reviewer: 'Alice', rating: 5, comment: 'Great borrower, paid on time!', date: '2025-03-16' },
            { id: 2, reviewer: 'Bob', rating: 4, comment: 'Reliable investor, quick to fund.', date: '2025-02-28' },
            { id: 3, reviewer: 'Charlie', rating: 5, comment: 'Excellent communication throughout the loan process.', date: '2025-01-26' }
          ]
        };
        
        setUserReputation(sampleUserReputation);
        
        // Sample top users
        const sampleTopUsers = [
          { id: 1, name: 'Sarah J.', score: 98, level: 'Elite', badges: 7 },
          { id: 2, name: 'Michael T.', score: 95, level: 'Elite', badges: 6 },
          { id: 3, name: 'Jessica L.', score: 92, level: 'Elite', badges: 5 },
          { id: 4, name: 'David K.', score: 90, level: 'Trusted', badges: 4 },
          { id: 5, name: 'Emma R.', score: 88, level: 'Trusted', badges: 4 }
        ];
        
        setTopUsers(sampleTopUsers);
      } catch (error) {
        console.error('Error fetching reputation data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReputationData();
  }, []);

  const handleEndorsementSubmit = () => {
    if (!endorsement.trim()) return;
    
    // In a real app, you would send this to your backend
    console.log('Endorsement submitted:', endorsement);
    
    // Clear the input
    setEndorsement('');
    
    // Show success message (in a real app)
    alert('Endorsement submitted successfully!');
  };

  const getBadgeIcon = (iconType) => {
    switch (iconType) {
      case 'verified':
        return <VerifiedUserIcon />;
      case 'payment':
        return <TrendingUpIcon />;
      case 'investment':
        return <SecurityIcon />;
      default:
        return <StarIcon />;
    }
  };

  const getReputationLevelColor = (level) => {
    switch (level) {
      case 'Elite':
        return '#8E44AD'; // Purple
      case 'Trusted':
        return '#27AE60'; // Green
      case 'Established':
        return '#2980B9'; // Blue
      case 'Growing':
        return '#F39C12'; // Orange
      case 'New':
        return '#95A5A6'; // Gray
      default:
        return '#3498DB'; // Default blue
    }
  };

  const getReputationDescription = (score) => {
    if (score >= 95) return 'Exceptional standing with perfect repayment history';
    if (score >= 85) return 'Very reliable with strong history of timely repayments';
    if (score >= 75) return 'Good standing with consistent repayment behavior';
    if (score >= 60) return 'Building reputation with some positive history';
    return 'New to the platform, limited history available';
  };

  return (
    <Container>
      <Typography variant="h4" component="h1" gutterBottom>
        Reputation System
      </Typography>
      
      {!isAuthenticated ? (
        <Alert severity="info" sx={{ mb: 3 }}>
          Please connect your wallet to view your reputation profile.
        </Alert>
      ) : null}
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={4}>
          <Grid item xs={12} md={8}>
            <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Avatar 
                  sx={{ 
                    width: 80, 
                    height: 80, 
                    bgcolor: getReputationLevelColor(userReputation.level),
                    mr: 3
                  }}
                >
                  {userProfile?.shortAddress?.charAt(0) || 'U'}
                </Avatar>
                
                <Box>
                  <Typography variant="h5" gutterBottom>
                    {userProfile?.shortAddress || 'Anonymous User'}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Chip 
                      label={userReputation.level} 
                      sx={{ 
                        bgcolor: getReputationLevelColor(userReputation.level),
                        color: 'white',
                        mr: 1
                      }} 
                    />
                    
                    <Rating 
                      value={userReputation.score / 20} 
                      precision={0.5} 
                      readOnly 
                      sx={{ ml: 1 }}
                    />
                  </Box>
                </Box>
                
                <Box sx={{ ml: 'auto', textAlign: 'center' }}>
                  <Typography variant="h3" sx={{ color: getReputationLevelColor(userReputation.level) }}>
                    {userReputation.score}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Reputation Score
                  </Typography>
                </Box>
              </Box>
              
              <Typography variant="body1" paragraph>
                {getReputationDescription(userReputation.score)}
              </Typography>
              
              <Divider sx={{ my: 3 }} />
              
              <Typography variant="h6" gutterBottom>
                Earned Badges
              </Typography>
              
              <Grid container spacing={2} sx={{ mb: 4 }}>
                {userReputation.badges.map((badge) => (
                  <Grid item xs={12} sm={4} key={badge.id}>
                    <Paper elevation={1} sx={{ p: 2, textAlign: 'center', height: '100%' }}>
                      <Box sx={{ color: 'primary.main', mb: 1 }}>
                        {getBadgeIcon(badge.icon)}
                      </Box>
                      <Typography variant="subtitle1" gutterBottom>
                        {badge.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {badge.description}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
              
              <Typography variant="h6" gutterBottom>
                Reputation History
              </Typography>
              
              <List>
                {userReputation.history.map((item) => (
                  <ListItem key={item.id} divider>
                    <ListItemText
                      primary={item.action}
                      secondary={`${item.date} - ${item.description}`}
                    />
                    <Chip 
                      label={`+${item.points} points`} 
                      color="primary" 
                      size="small" 
                      variant="outlined"
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
            
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Reviews & Endorsements
              </Typography>
              
              <List>
                {userReputation.reviews.map((review) => (
                  <ListItem key={review.id} alignItems="flex-start" divider>
                    <ListItemAvatar>
                      <Avatar>
                        <PersonIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="subtitle1">
                            {review.reviewer}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {review.date}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <>
                          <Rating value={review.rating} readOnly size="small" />
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            {review.comment}
                          </Typography>
                        </>
                      }
                    />
                  </ListItem>
                ))}
              </List>
              
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Leave an Endorsement
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  placeholder="Write your endorsement here..."
                  value={endorsement}
                  onChange={(e) => setEndorsement(e.target.value)}
                  sx={{ mb: 2 }}
                />
                <Button 
                  variant="contained" 
                  color="primary"
                  onClick={handleEndorsementSubmit}
                  disabled={!endorsement.trim()}
                >
                  Submit Endorsement
                </Button>
              </Box>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                How Reputation Works
              </Typography>
              
              <Typography variant="body2" paragraph>
                Your reputation score is calculated based on your activity and behavior on the LendSmart platform.
              </Typography>
              
              <Typography variant="subtitle2" gutterBottom>
                Actions that increase your score:
              </Typography>
              <Typography variant="body2" component="ul" sx={{ pl: 2, mb: 2 }}>
                <li>Repaying loans on time</li>
                <li>Funding loans</li>
                <li>Completing identity verification</li>
                <li>Receiving positive reviews</li>
                <li>Regular platform activity</li>
              </Typography>
              
              <Typography variant="subtitle2" gutterBottom>
                Reputation Levels:
              </Typography>
              <Box sx={{ pl: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#8E44AD', mr: 1 }} />
                  <Typography variant="body2">Elite (95-100): Exceptional standing</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#27AE60', mr: 1 }} />
                  <Typography variant="body2">Trusted (85-94): Very reliable</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#2980B9', mr: 1 }} />
                  <Typography variant="body2">Established (75-84): Good standing</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#F39C12', mr: 1 }} />
                  <Typography variant="body2">Growing (60-74): Building reputation</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#95A5A6', mr: 1 }} />
                  <Typography variant="body2">New (0-59): Limited history</Typography>
                </Box>
              </Box>
            </Paper>
            
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Top Users
              </Typography>
              
              <List>
                {topUsers.map((user, index) => (
                  <ListItem key={user.id} divider={index < topUsers.length - 1}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: getReputationLevelColor(user.level) }}>
                        {index + 1}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={user.name}
                      secondary={`${user.level} • ${user.badges} badges`}
                    />
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="h6" sx={{ color: getReputationLevelColor(user.level) }}>
                        {user.score}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Score
                      </Typography>
                    </Box>
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Container>
  );
}

export default Reputation;
