import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import lightTheme from './lightTheme';
import darkTheme from './darkTheme';
import { getTheme, saveTheme } from '../utils/settingsStorage';

// Define the shape of our theme context
interface ThemeContextType {
  theme: typeof lightTheme;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (isDark: boolean) => void;
}

// Create the context with a default value
export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

/**
 * ThemeProvider Component
 * 
 * Provides theme context to the application and handles theme switching.
 */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Get device color scheme
  const deviceTheme = useColorScheme();
  
  // State to track if dark mode is enabled
  const [isDark, setIsDark] = useState<boolean>(deviceTheme === 'dark');
  
  // Load saved theme preference on mount
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const savedTheme = await getTheme();
        // If we have a saved preference, use it
        if (savedTheme !== null) {
          setIsDark(savedTheme);
        }
      } catch (error) {
        console.error('Failed to load theme preference:', error);
      }
    };
    
    loadThemePreference();
  }, []);
  
  // Toggle between light and dark themes
  const toggleTheme = () => {
    setIsDark(prevMode => {
      const newMode = !prevMode;
      saveTheme(newMode).catch(error => {
        console.error('Failed to save theme preference:', error);
      });
      return newMode;
    });
  };
  
  // Set theme directly
  const setThemeMode = (darkMode: boolean) => {
    setIsDark(darkMode);
    saveTheme(darkMode).catch(error => {
      console.error('Failed to save theme preference:', error);
    });
  };
  
  // Get the current theme based on isDark state
  const theme = isDark ? darkTheme : lightTheme;
  
  // Create the context value
  const contextValue: ThemeContextType = {
    theme,
    isDark,
    toggleTheme,
    setTheme: setThemeMode
  };
  
  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;