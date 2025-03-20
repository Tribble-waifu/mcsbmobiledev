/**
 * Dark Theme Configuration
 * 
 * This file defines the color palette and styling for the dark theme mode.
 */

const darkTheme = {
  // Core colors
  colors: {
    primary: '#3498db',
    secondary: '#2ecc71',
    accent: '#f39c12',
    
    // Background colors
    background: {
      primary: '#121212',
      secondary: '#1e1e1e',
      tertiary: '#2d2d2d',
    },
    
    // Text colors
    text: {
      primary: '#ffffff',
      secondary: '#e0e0e0',
      tertiary: '#a0a0a0',
      inverse: '#333333',
    },
    
    // Border colors
    border: {
      light: '#3d3d3d',
      medium: '#505050',
      dark: '#626262',
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
      background: '#1e1e1e',
      shadow: 'rgba(0, 0, 0, 0.3)',
    },
    
    input: {
      background: '#2d2d2d',
      placeholder: '#808080',
      border: '#3d3d3d',
    },
    
    button: {
      primary: '#3498db',
      secondary: '#2ecc71',
      disabled: '#555555',
    },
    
    toggle: {
      track: {
        active: '#81b0ff',
        inactive: '#505050',
      },
      thumb: {
        active: '#3498db',
        inactive: '#a0a0a0',
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
      shadowOpacity: 0.22,
      shadowRadius: 2.22,
      elevation: 2,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.29,
      shadowRadius: 4.65,
      elevation: 5,
    },
    large: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.37,
      shadowRadius: 7.49,
      elevation: 12,
    },
  },
};

export default darkTheme;