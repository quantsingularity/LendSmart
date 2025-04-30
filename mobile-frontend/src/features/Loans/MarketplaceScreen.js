import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { Text, Card, Button, Searchbar, useTheme, Chip } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { spacing } from '../../../theme/theme';
import apiService from '../../../services/apiService'; // Assuming API service is set up

// Placeholder data for marketplace loans
const placeholderLoans = [
  { id: '1', amount: 1500, interestRate: 8.5, term: 12, purpose: 'Debt Consolidation', creditScoreRange: '650-700', status: 'Available' },
  { id: '2', amount: 500, interestRate: 12.0, term: 6, purpose: 'Small Business', creditScoreRange: '600-650', status: 'Available' },
  { id: '3', amount: 3000, interestRate: 7.0, term: 24, purpose: 'Home Improvement', creditScoreRange: '700+', status: 'Available' },
  { id: '4', amount: 1000, interestRate: 9.0, term: 9, purpose: 'Education', creditScoreRange: '680-720', status: 'Funded' },
];

const MarketplaceScreen = ({ navigation }) => {
  const theme = useTheme();
  const styles = createStyles(theme);
  const [searchQuery, setSearchQuery] = useState('');
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLoans = async () => {
      try {
        setLoading(true);
        setError(null);
        // TODO: Replace with actual API call to fetch loans
        // const response = await apiService.get('/loans/marketplace', { params: { search: searchQuery /*, filters */ } });
        // setLoans(response.data);
        
        // Using placeholder data for now
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
        const filteredLoans = placeholderLoans.filter(loan => 
          loan.purpose.toLowerCase().includes(searchQuery.toLowerCase()) ||
          loan.amount.toString().includes(searchQuery)
        );
        setLoans(filteredLoans);

      } catch (err) {
        console.error('Failed to fetch loans:', err);
        setError('Failed to load loan marketplace. Please try again.');
        setLoans(placeholderLoans); // Show placeholder on error for demo
      } finally {
        setLoading(false);
      }
    };

    fetchLoans();
  }, [searchQuery]);

  const onChangeSearch = query => setSearchQuery(query);

  const renderLoanItem = ({ item }) => (
    <Card style={styles.loanCard}>
      <Card.Title 
        title={`Loan: $${item.amount}`} 
        subtitle={`${item.interestRate}% Interest | ${item.term} Months`} 
        titleStyle={styles.cardTitle}
        subtitleStyle={styles.cardSubtitle}
      />
      <Card.Content>
        <View style={styles.detailRow}>
          <MaterialCommunityIcons name="briefcase-outline" size={16} color={theme.colors.textSecondary} />
          <Text style={styles.detailText}>Purpose: {item.purpose}</Text>
        </View>
        <View style={styles.detailRow}>
          <MaterialCommunityIcons name="credit-card-scan-outline" size={16} color={theme.colors.textSecondary} />
          <Text style={styles.detailText}>Credit Score: {item.creditScoreRange}</Text>
        </View>
         <Chip 
           icon={item.status === 'Available' ? "check-circle-outline" : "information-outline"}
           style={[styles.statusChip, { backgroundColor: item.status === 'Available' ? theme.colors.success : theme.colors.disabled }]} 
           textStyle={{ color: '#fff' }}
         >
           {item.status}
         </Chip>
      </Card.Content>
      <Card.Actions>
        <Button 
          onPress={() => console.log('View details for loan:', item.id)} // TODO: Navigate to Loan Detail Screen
        >
          View Details
        </Button>
        <Button 
          mode="contained" 
          disabled={item.status !== 'Available'}
          onPress={() => console.log('Fund loan:', item.id)} // TODO: Implement funding logic
        >
          Fund Loan
        </Button>
      </Card.Actions>
    </Card>
  );

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search loans by purpose or amount"
        onChangeText={onChangeSearch}
        value={searchQuery}
        style={styles.searchbar}
      />
      {/* TODO: Add Filter Chips/Button here */} 
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : error ? (
         <View style={styles.errorContainer}>
           <Text style={styles.errorText}>{error}</Text>
           {/* Optionally add a retry button */}
         </View>
      ) : (
        <FlatList
          data={loans}
          renderItem={renderLoanItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No loans found matching your criteria.</Text>
            </View>
          )}
        />
      )}
    </View>
  );
};

const createStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  searchbar: {
    margin: spacing.md,
    elevation: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  errorText: {
    color: theme.colors.error,
    textAlign: 'center',
  },
  listContainer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  loanCard: {
    marginBottom: spacing.md,
    elevation: 3,
  },
  cardTitle: {
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  cardSubtitle: {
    color: theme.colors.textSecondary,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  detailText: {
    marginLeft: spacing.sm,
    color: theme.colors.textPrimary,
  },
  statusChip: {
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50, // Adjust as needed
  },
  emptyText: {
    fontSize: theme.fontSizes.body1,
    color: theme.colors.textSecondary,
  },
});

export default MarketplaceScreen;

