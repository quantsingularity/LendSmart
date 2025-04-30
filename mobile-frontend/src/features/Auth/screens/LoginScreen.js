import React, { useState, useContext } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button, Text, useTheme, ActivityIndicator } from 'react-native-paper';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { AuthContext } from '../../../contexts/AuthContext';
import { spacing } from '../../../theme/theme';

const LoginSchema = Yup.object().shape({
  email: Yup.string().email('Invalid email').required('Required'),
  password: Yup.string().min(6, 'Password too short').required('Required'),
});

const LoginScreen = ({ navigation }) => {
  const { login, loading, error } = useContext(AuthContext);
  const theme = useTheme();
  const styles = createStyles(theme);

  const handleLogin = async (values, { setSubmitting }) => {
    try {
      await login(values);
      // Navigation to MainApp happens automatically in AppNavigator based on token state
    } catch (err) {
      // Error is displayed via the error state from AuthContext
      console.log("Login error caught in screen:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Back!</Text>
      <Formik
        initialValues={{ email: '', password: '' }}
        validationSchema={LoginSchema}
        onSubmit={handleLogin}
      >
        {({ handleChange, handleBlur, handleSubmit, values, errors, touched, isSubmitting }) => (
          <View style={styles.formContainer}>
            <TextInput
              label="Email"
              value={values.email}
              onChangeText={handleChange('email')}
              onBlur={handleBlur('email')}
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
              error={touched.email && !!errors.email}
            />
            {touched.email && errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

            <TextInput
              label="Password"
              value={values.password}
              onChangeText={handleChange('password')}
              onBlur={handleBlur('password')}
              secureTextEntry
              style={styles.input}
              error={touched.password && !!errors.password}
            />
            {touched.password && errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

            {error && <Text style={styles.serverErrorText}>{error}</Text>}

            <Button
              mode="contained"
              onPress={handleSubmit}
              style={styles.button}
              disabled={isSubmitting || loading}
              loading={isSubmitting || loading}
            >
              Login
            </Button>

            <Button
              mode="text"
              onPress={() => navigation.navigate('Register')}
              style={styles.switchButton}
              disabled={isSubmitting || loading}
            >
              Don't have an account? Register
            </Button>
          </View>
        )}
      </Formik>
    </View>
  );
};

const createStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.md,
    backgroundColor: theme.colors.background,
  },
  title: {
    fontSize: theme.fontSizes.h2,
    fontWeight: 'bold',
    color: theme.colors.primary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  formContainer: {
    width: '100%',
  },
  input: {
    marginBottom: spacing.sm,
    backgroundColor: theme.colors.surface, // Ensure input background contrasts
  },
  button: {
    marginTop: spacing.md,
    paddingVertical: spacing.xs,
  },
  switchButton: {
    marginTop: spacing.sm,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: theme.fontSizes.caption,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
   serverErrorText: {
    color: theme.colors.error,
    fontSize: theme.fontSizes.body2,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
});

export default LoginScreen;

