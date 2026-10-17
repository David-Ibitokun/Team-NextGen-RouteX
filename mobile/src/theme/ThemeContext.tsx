import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { lightTheme, darkTheme, ThemeColors } from './colors';

interface ThemeContextType {
  isDark: boolean;
  theme: ThemeColors;
  toggleTheme: () => void;
  setScheme: (scheme: 'light' | 'dark' | 'auto') => void;
}

const ThemeContext = createContext<ThemeContextType>({
  isDark: false,
  theme: lightTheme,
  toggleTheme: () => {},
  setScheme: () => {},
});

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const systemScheme = useColorScheme();
  const [userChoice, setUserChoice] = useState<'light' | 'dark' | null>(null);

  const effectiveScheme = userChoice ?? (systemScheme === 'dark' ? 'dark' : 'light');
  const isDark = effectiveScheme === 'dark';
  const theme = isDark ? darkTheme : lightTheme;

  const toggleTheme = () => {
    setUserChoice((prev) => {
      const current = prev ?? (systemScheme === 'dark' ? 'dark' : 'light');
      return current === 'dark' ? 'light' : 'dark';
    });
  };

  const setScheme = (scheme: 'light' | 'dark' | 'auto') => {
    if (scheme === 'auto') {
      setUserChoice(null);
    } else {
      setUserChoice(scheme);
    }
  };

  return (
    <ThemeContext.Provider value={{ isDark, theme, toggleTheme, setScheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
