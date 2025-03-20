import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import ThemeProvider from './themes/ThemeProvider';
import useTheme from './themes/useTheme';
import { View } from 'react-native';

// A component that uses the theme
const ThemedLayout = () => {
  const { theme, isDark } = useTheme();
  
  return (
    <View style={{ 
      flex: 1, 
      backgroundColor: theme.colors.background.primary 
    }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false, // Hide all headers app-wide
          headerStyle: {
            backgroundColor: theme.colors.background.primary,
          },
          headerTintColor: theme.colors.text.primary,
          contentStyle: {
            backgroundColor: theme.colors.background.secondary,
          },
        }}
      />
    </View>
  );
};

// The root layout component that provides the theme
export default function RootLayout() {
  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <ThemedLayout />
      </SafeAreaProvider>
    </ThemeProvider>
  );
}
