/**
 * Theme Hook
 * 
 * A custom hook that provides access to the current theme throughout the application.
 */

import { useContext } from 'react';
import { ThemeContext } from './ThemeProvider';

/**
 * useTheme hook
 * 
 * Provides access to the current theme and theme-switching functionality.
 * 
 * @returns {Object} An object containing the current theme and theme toggle function
 */
const useTheme = () => {
  const context = useContext(ThemeContext);
  
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  
  return context;
};

export default useTheme;