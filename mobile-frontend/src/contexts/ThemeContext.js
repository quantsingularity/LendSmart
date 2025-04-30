import React, { createContext, useState, useMemo, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import { CombinedLightTheme, CombinedDarkTheme } from './theme';

export const ThemeContext = createContext({
  isDark: false,
  theme: CombinedLightTheme,
  toggleTheme: () => {},
});

export const ThemeProvider = ({ children }) => {
  const colorScheme = useColorScheme(); // 'light', 'dark', or null
  const [isDark, setIsDark] = useState(colorScheme === 'dark');

  const toggleTheme = useCallback(() => {
    setIsDark(prevIsDark => !prevIsDark);
  }, []);

  // Update theme based on isDark state
  // Also handles initial system preference
  React.useEffect(() => {
    setIsDark(colorScheme === 'dark');
  }, [colorScheme]);

  const theme = useMemo(() => (isDark ? CombinedDarkTheme : CombinedLightTheme), [isDark]);

  return (
    <ThemeContext.Provider value={{ isDark, theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

