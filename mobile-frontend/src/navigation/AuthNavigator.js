import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import actual screen components
import LoginScreen from '../features/Auth/screens/LoginScreen';
import RegisterScreen from '../features/Auth/screens/RegisterScreen';

// Placeholder for Forgot Password, etc.
import { View, Text } from 'react-native';
const PlaceholderScreen = ({ route }) => (
  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
    <Text>{route.name} Screen (Placeholder)</Text>
  </View>
);

const Stack = createNativeStackNavigator();

const AuthNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      {/* Add other auth-related screens like Forgot Password here */}
      {/* <Stack.Screen name="ForgotPassword" component={PlaceholderScreen} /> */}
    </Stack.Navigator>
  );
};

export default AuthNavigator;

