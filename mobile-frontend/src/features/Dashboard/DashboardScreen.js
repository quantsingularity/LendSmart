import React, { useContext } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Button, useTheme, ActivityIndicator } from 'react-native-paper';
import { spacing } from '../../../theme/theme';
import { AuthContext } from '../../../contexts/AuthContext';

// Placeholder data for dashboard
const loanSummary = {
  activeLoans: 2,
  totalBorrowed: 5000,
  totalLent: 3000,
  reputation: 4.8,
};

const recentActivity = [
  { id: 1, type: 'Loan Funded', amount: '$1,000', date: '2025-04-25', status: 'Completed' },
  { id: 2, type: 'Loan Repayment', amount: '$250', date: '2025-04-20', status: 'Completed' },
  { id: 3, type: 'Loan Application', amount: '$2,000', date: '2025-04-15', status: 'Pending' },
];

const DashboardScreen = ({ navigation }) => {
  const { user } = useContext(AuthContext);
  const theme = useTheme();
  const styles = createStyles(theme);

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Hello, {user?.name || 'User'}</Text>
        <Text style={styles.subGreeting}>Welcome to your LendSmart dashboard</Text>
      </View>

      <View style={styles.summaryContainer}>
        <Card style={styles.summaryCard}>
          <Card.Content>
            <Text style={styles.cardTitle}>Loan Summary</Text>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{loanSummary.activeLoans}</Text>
                <Text style={styles.summaryLabel}>Active Loans</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>${loanSummary.totalBorrowed}</Text>
                <Text style={styles.summaryLabel}>Total Borrowed</Text>
              </View>
            </View>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>${loanSummary.totalLent}</Text>
                <Text style={styles.summaryLabel}>Total Lent</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{loanSummary.reputation}</Text>
                <Text style={styles.summaryLabel}>Reputation</Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      </View>

      <View style={styles.actionsContainer}>
        <Button 
          mode="contained" 
          style={styles.actionButton}
          onPress={() => navigation.navigate('Apply')}
        >
          Apply for Loan
        </Button>
        <Button 
          mode="outlined" 
          style={styles.actionButton}
          onPress={() => navigation.navigate('Marketplace')}
        >
          Browse Marketplace
        </Button>
      </View>

      <View style={styles.recentActivityContainer}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        {recentActivity.map((activity) => (
          <Card key={activity.id} style={styles.activityCard}>
            <Card.Content>
              <View style={styles.activityRow}>
                <View>
                  <Text style={styles.activityType}>{activity.type}</Text>
                  <Text style={styles.activityDate}>{activity.date}</Text>
                </View>
                <View>
                  <Text style={styles.activityAmount}>{activity.amount}</Text>
                  <Text 
                    style={[
                      styles.activityStatus, 
                      { color: activity.status === 'Completed' ? theme.colors.success : theme.colors.warning }
                    ]}
                  >
                    {activity.status}
                  </Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        ))}
      </View>
    </ScrollView>
  );
};

const createStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: spacing.md,
    paddingTop: spacing.lg,
  },
  greeting: {
    fontSize: theme.fontSizes.h4,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
  },
  subGreeting: {
    fontSize: theme.fontSizes.body1,
    color: theme.colors.textSecondary,
    marginTop: spacing.xs,
  },
  summaryContainer: {
    padding: spacing.md,
  },
  summaryCard: {
    borderRadius: theme.borderRadius.lg,
    elevation: 4,
  },
  cardTitle: {
    fontSize: theme.fontSizes.h6,
    fontWeight: 'bold',
    marginBottom: spacing.md,
    color: theme.colors.textPrimary,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: theme.fontSizes.h5,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  summaryLabel: {
    fontSize: theme.fontSizes.body2,
    color: theme.colors.textSecondary,
    marginTop: spacing.xs,
  },
  actionsContainer: {
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: spacing.xs,
  },
  recentActivityContainer: {
    padding: spacing.md,
  },
  sectionTitle: {
    fontSize: theme.fontSizes.h6,
    fontWeight: 'bold',
    marginBottom: spacing.md,
    color: theme.colors.textPrimary,
  },
  activityCard: {
    marginBottom: spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  activityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityType: {
    fontSize: theme.fontSizes.body1,
    fontWeight: '500',
    color: theme.colors.textPrimary,
  },
  activityDate: {
    fontSize: theme.fontSizes.caption,
    color: theme.colors.textSecondary,
    marginTop: spacing.xs,
  },
  activityAmount: {
    fontSize: theme.fontSizes.body1,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    textAlign: 'right',
  },
  activityStatus: {
    fontSize: theme.fontSizes.caption,
    textAlign: 'right',
    marginTop: spacing.xs,
  },
});

export default DashboardScreen;
