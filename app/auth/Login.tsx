import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

// Import all components
import Button from '../components/Button';
import Card from '../components/Card';
import AlertMessage from '../components/AlertMessage';
import InputField from '../components/InputField';
import LoadingIndicator from '../components/LoadingIndicator';
import useTheme from '../themes/useTheme';

// Import API functions
import { credentialLogin } from '../api/loginApi';

// Import i18n configuration
import '../locales/i18n';

// Import Constants to access app.json information
import Constants from 'expo-constants';

export default function Login() {
  const { t } = useTranslation();
  const { theme } = useTheme();  // Extract theme from the returned context

  // Define dynamic styles that need theme access
  const dynamicStyles = {
    loaderWrapper: {
      padding: 20,
      borderRadius: 10,
      backgroundColor: theme.colors.card.background,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    }
  };
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<'success' | 'error' | 'warning' | 'info'>('info');
  const [isLoading, setIsLoading] = useState(false);
  const [showDemoLoader, setShowDemoLoader] = useState(true); // Added state for demo loader

  // Added effect to hide demo loader after a few seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowDemoLoader(false);
    }, 3000); // Show for 3 seconds
    
    return () => clearTimeout(timer);
  }, []);

  // Validation functions remain the same
  const validateUsername = (username: string) => {
    if (!username) {
      setUsernameError(t('login.usernameRequired'));
      return false;
    }
    setUsernameError('');
    return true;
  };

  const validatePassword = (password: string) => {
    if (!password) {
      setPasswordError(t('login.passwordRequired'));
      return false;
    } else if (password.length < 6) {
      setPasswordError(t('login.passwordLength'));
      return false;
    }
    setPasswordError('');
    return true;
  };

  const handleLogin = async () => {
    const isUsernameValid = validateUsername(username);
    const isPasswordValid = validatePassword(password);

    if (isUsernameValid && isPasswordValid) {
      setIsLoading(true);
      
      try {
        const response = await credentialLogin({ username, password });
        
        if (response.success) {
          setAlertType('success');
          setAlertMessage(t('login.loginSuccess'));
          setAlertVisible(true);
          
          setTimeout(() => {
            // Navigate to ProfileSwitch instead of home
            router.replace('./ProfileSwitch');
          }, 1500);
        } else {
          setAlertType('error');
          setAlertMessage(response.message || t('login.checkCredentials'));
          setAlertVisible(true);
        }
      } catch (error) {
        console.error('Login error:', error);
        setAlertType('error');
        setAlertMessage(t('login.checkCredentials'));
        setAlertVisible(true);
      } finally {
        setIsLoading(false);
      }
    } else {
      setAlertType('error');
      setAlertMessage(t('login.checkCredentials'));
      setAlertVisible(true);
    }
  };
  
  const handleScanQR = () => {
    router.push('/auth/ScanQR');
  };
  
  const handleSettings = () => {
    router.push('/modules/settings/SettingScreen');
  };

  // Remove the demo loader code since we only want to show animation after login button click
  
  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.colors.background.primary }]}
    >
      {/* Hide the header */}
      <Stack.Screen options={{ headerShown: false }} />
      
      <AlertMessage
        visible={alertVisible}
        type={alertType}
        message={alertMessage}
        onClose={() => setAlertVisible(false)}
      />
  
      {/* Remove the demo loader conditional rendering */}
      <View style={styles.logoContainer}>
        <Image 
          source={require('../../assets/images/logo/mcsb.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={[styles.title, { color: theme.colors.text.primary }]}>
          {t('login.welcomeBack')}
        </Text>
      </View>
  
      <Card elevation={3} style={[styles.cardContainer, { backgroundColor: theme.colors.card.background }]}>
        <InputField
          label={t('login.username')}
          placeholder={t('login.usernameEnter')}
          value={username}
          onChangeText={(text) => {
            setUsername(text);
            if (usernameError) validateUsername(text);
          }}
          autoCapitalize="none"
          leftIcon="person-outline"
          error={usernameError}
          editable={!isLoading}
        />
        
        <InputField
          label={t('login.password')}
          placeholder={t('login.passwordEnter')}
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            if (passwordError) validatePassword(text);
          }}
          secureTextEntry
          leftIcon="lock-closed-outline"
          error={passwordError}
          editable={!isLoading}
        />
  
        <Button 
          title={isLoading ? t('login.loginButton') : t('login.loginButton')}
          onPress={handleLogin}
          style={styles.loginButton}
          size="large"
          disabled={isLoading}
        />
  
        <View style={styles.additionalButtons}>
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={handleScanQR}
          >
            <Ionicons name="qr-code" size={24} color={theme.colors.primary} />
            <Text style={[styles.iconButtonText, { color: theme.colors.primary }]}>
              {t('login.scanQR')}
            </Text>
          </TouchableOpacity>
  
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={handleSettings}
          >
            <Ionicons name="settings" size={24} color={theme.colors.primary} />
            <Text style={[styles.iconButtonText, { color: theme.colors.primary }]}>
              {t('login.settings')}
            </Text>
          </TouchableOpacity>
        </View>
  
        {/* Rest of the card content */}
      </Card>
  
      {/* Footer */}
      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: theme.colors.text.secondary }]}>
          v{appVersion}
        </Text>
      </View>
  
      {/* Overlay loading indicator that appears when isLoading is true */}
      {isLoading && (
        <View style={styles.overlayContainer}>
          <View style={dynamicStyles.loaderWrapper}>
            <LoadingIndicator 
              size={60} 
              // Remove these color props to use the default colors from LoadingIndicator
              // primaryColor={theme.colors.primary}
              // secondaryColor={theme.colors.secondary}
              duration={600}
              showText={true}
            />
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

// Update styles to include overlay container
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'flex-start', // Changed from 'center' to 'flex-start'
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 100, // Added specific top margin to push content down
    marginBottom: 24,
  },
  logo: {
    width: 80,
    height: 80,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 12,
  },
  cardContainer: {
    padding: 24,
  },
  loginButton: {
    marginTop: 16,
  },
  buttonLoadingContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
    zIndex: 10,
  },
  // Remove the standaloneLoadingContainer and loadingText styles
  standaloneLoadingContainer: {
    marginVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: 'bold',
  },
  additionalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 24,
    marginBottom: 10,
  },
  iconButton: {
    alignItems: 'center',
    padding: 10,
  },
  iconButtonText: {
    marginTop: 5,
    fontSize: 14,
  },
  forgotPassword: {
    alignSelf: 'center',
    marginTop: 16,
  },
  forgotPasswordText: {
    fontSize: 14,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 'auto',
    marginBottom: 20,
  },
  footerText: {
    fontSize: 14,
  },
  signupText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  // Add the missing styles
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)', // Semi-transparent background
    zIndex: 1000,
  },
  // Remove the loaderWrapper style from here since we're defining it inside the component
});

// Get app version from app.json
const appVersion = Constants.expoConfig?.version || '1.0.0';