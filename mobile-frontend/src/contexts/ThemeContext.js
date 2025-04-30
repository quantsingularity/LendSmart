import React, { createContext, useState, useMemo, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import PropTypes from 'prop-types'; // Import PropTypes
// Corrected import path for theme
import { CombinedLightTheme, CombinedDarkTheme } from '../theme/theme';

export const ThemeContext = createContext({
  isDark: false,
  theme: CombinedLightTheme,
  toggleTheme: () => {},
});

export const ThemeProvider = ({ children }) => {
  const colorScheme = useColorScheme(); // 'light', 'dark', or null
  // Initialize state based on system preference
  const [isDark, setIsDark] = useState(colorScheme === 'dark');

  const toggleTheme = useCallback(() => {
    setIsDark(prevIsDark => !prevIsDark);
    // TODO: Persist theme preference (e.g., using AsyncStorage) if needed
  }, []);

  // Update theme based on system changes if the user hasn't manually toggled
  // This effect might need refinement based on whether manual toggle overrides system
  React.useEffect(() => {
    // Only update from system if the state matches the initial system state?
    // Or always follow system? For now, let's always sync with system change.
    setIsDark(colorScheme === 'dark');
  }, [colorScheme]);

  const theme = useMemo(() => (isDark ? CombinedDarkTheme : CombinedLightTheme), [isDark]);

  return (
    <ThemeContext.Provider value={{ isDark, theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Add prop types validation
ThemeProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

