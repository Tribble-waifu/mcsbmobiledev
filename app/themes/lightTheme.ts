/**
 * Light Theme Configuration
 * 
 * This file defines the color palette and styling for the light theme mode.
 */

const lightTheme = {
  // Core colors
  colors: {
    primary: '#3498db',
    secondary: '#2ecc71',
    accent: '#f39c12',
    
    // Background colors
    background: {
      primary: '#ffffff',
      secondary: '#f8f9fa',
      tertiary: '#f1f3f5',
    },
    
    // Text colors
    text: {
      primary: '#333333',
      secondary: '#666666',
      tertiary: '#999999',
      inverse: '#ffffff',
    },
    
    // Border colors
    border: {
      light: '#e1e1e1',
      medium: '#d1d1d1',
      dark: '#c1c1c1',
    },
    
    // Status colors
    status: {
      success: '#4CAF50',
      error: '#F44336',
      warning: '#FF9800',
      info: '#2196F3',
    },
    
    // Component specific colors
    card: {
      background: '#ffffff',
      shadow: 'rgba(0, 0, 0, 0.1)',
    },
    
    input: {
      background: '#f9f9f9',
      placeholder: '#999999',
      border: '#dddddd',
    },
    
    button: {
      primary: '#3498db',
      secondary: '#2ecc71',
      disabled: '#cccccc',
    },
    
    toggle: {
      track: {
        active: '#81b0ff',
        inactive: '#d1d1d1',
      },
      thumb: {
        active: '#3498db',
        inactive: '#f4f3f4',
      },
    },
  },
  
  // Typography
  typography: {
    fontFamily: {
      regular: 'System',
      medium: 'System',
      bold: 'System',
    },
    fontSize: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
      xxl: 24,
    },
  },
  
  // Spacing
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  
  // Border radius
  borderRadius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    round: 9999,
  },
  
  // Shadows
  shadows: {
    small: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.18,
      shadowRadius: 1.0,
      elevation: 1,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 3,
    },
    large: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.30,
      shadowRadius: 4.65,
      elevation: 8,
    },
  },
};

export default lightTheme;