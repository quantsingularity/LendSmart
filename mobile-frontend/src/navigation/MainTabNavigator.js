import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from 'react-native-paper';

// Import actual screen components
import DashboardScreen from '../features/Dashboard/DashboardScreen';
import MarketplaceScreen from '../features/Loans/MarketplaceScreen';
import LoanApplicationScreen from '../features/Loans/LoanApplicationScreen';
import ProfileScreen from '../features/Profile/ProfileScreen';

const Tab = createBottomTabNavigator();

const MainTabNavigator = () => {
  const theme = useTheme(); // Use theme from react-native-paper

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'view-dashboard' : 'view-dashboard-outline';
          } else if (route.name === 'Marketplace') {
            iconName = focused ? 'storefront' : 'storefront-outline';
          } else if (route.name === 'Apply') {
            iconName = focused ? 'file-document-edit' : 'file-document-edit-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'account-circle' : 'account-circle-outline';
          }

          // You can return any component that you like here!
          return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.colors.surface, // Use theme surface color for tab bar background
          borderTopColor: theme.colors.border, // Use theme border color
        },
        headerStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerTintColor: theme.colors.textPrimary,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      {/* Use actual screen components */}
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Marketplace" component={MarketplaceScreen} />
      <Tab.Screen name="Apply" component={LoanApplicationScreen} options={{ title: 'Apply for Loan' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
      {/* Add other main screens like Notifications, Analytics if needed */}
    </Tab.Navigator>
  );
};

export default MainTabNavigator;

