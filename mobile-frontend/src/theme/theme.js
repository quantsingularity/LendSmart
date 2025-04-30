import { DefaultTheme, DarkTheme } from 'react-native-paper';

// Based on docs/ui-design-concept.md

export const lightColors = {
  primary: '#3a86ff', // Vibrant Blue
  secondary: '#ff006e', // Vibrant Pink
  success: '#38b000', // Green
  warning: '#ffbe0b', // Amber
  error: '#ff5252', // Red
  background: '#f8f9fa', // Main background light
  surface: '#ffffff', // Card background light
  textPrimary: '#212529', // Primary text light
  textSecondary: '#6c757d', // Secondary text light
  border: '#dee2e6', // Light border color
  disabled: '#adb5bd',
  placeholder: '#6c757d',
  backdrop: 'rgba(0, 0, 0, 0.5)',
};

export const darkColors = {
  primary: '#3a86ff', // Vibrant Blue (can adjust for dark mode if needed)
  secondary: '#ff006e', // Vibrant Pink
  success: '#4caf50', // Adjusted Green for dark bg
  warning: '#ffc107', // Adjusted Amber
  error: '#f44336', // Adjusted Red
  background: '#121212', // Main background dark
  surface: '#1e1e1e', // Card background dark
  textPrimary: '#e9ecef', // Primary text dark
  textSecondary: '#adb5bd', // Secondary text dark
  border: '#495057', // Dark border color
  disabled: '#6c757d',
  placeholder: '#adb5bd',
  backdrop: 'rgba(0, 0, 0, 0.7)',
};

export const fonts = {
  primary: 'Poppins-Regular', // Assuming Poppins is added
  primaryMedium: 'Poppins-Medium',
  primarySemiBold: 'Poppins-SemiBold',
  primaryBold: 'Poppins-Bold',
  secondary: 'Inter-Regular', // Assuming Inter is added
  secondaryMedium: 'Inter-Medium',
  secondarySemiBold: 'Inter-SemiBold',
  secondaryBold: 'Inter-Bold',
};

export const fontSizes = {
  h1: 40,
  h2: 32,
  h3: 28,
  h4: 24,
  h5: 20,
  h6: 16,
  body1: 16,
  body2: 14,
  caption: 12,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
};

// Combine with react-native-paper themes
export const CombinedLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: lightColors.primary,
    accent: lightColors.secondary, // Note: 'accent' is deprecated, use 'secondary' or custom props
    background: lightColors.background,
    surface: lightColors.surface,
    text: lightColors.textPrimary,
    placeholder: lightColors.placeholder,
    disabled: lightColors.disabled,
    error: lightColors.error,
    notification: lightColors.secondary, // Example usage
    // Custom colors
    ...lightColors,
  },
  fonts: {
    // Map custom fonts if needed, Paper uses system fonts by default
    regular: { fontFamily: fonts.secondary, fontWeight: 'normal' },
    medium: { fontFamily: fonts.secondaryMedium, fontWeight: 'normal' }, // RN uses numeric weights
    light: { fontFamily: fonts.secondary, fontWeight: '300' },
    thin: { fontFamily: fonts.secondary, fontWeight: '100' },
  },
  roundness: borderRadius.md,
  // Add custom theme properties
  spacing: spacing,
  fontSizes: fontSizes,
  borderRadius: borderRadius,
};

export const CombinedDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: darkColors.primary,
    accent: darkColors.secondary,
    background: darkColors.background,
    surface: darkColors.surface,
    text: darkColors.textPrimary,
    placeholder: darkColors.placeholder,
    disabled: darkColors.disabled,
    error: darkColors.error,
    notification: darkColors.secondary,
    // Custom colors
    ...darkColors,
  },
  fonts: {
    regular: { fontFamily: fonts.secondary, fontWeight: 'normal' },
    medium: { fontFamily: fonts.secondaryMedium, fontWeight: 'normal' },
    light: { fontFamily: fonts.secondary, fontWeight: '300' },
    thin: { fontFamily: fonts.secondary, fontWeight: '100' },
  },
  roundness: borderRadius.md,
  // Add custom theme properties
  spacing: spacing,
  fontSizes: fontSizes,
  borderRadius: borderRadius,
};

