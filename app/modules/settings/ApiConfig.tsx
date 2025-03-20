import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';

import Card from '../../components/Card';
import Button from '../../components/Button';
import InputField from '../../components/InputField';
import AlertMessage from '../../components/AlertMessage';
import { getBaseUrl, saveBaseUrl } from '../../utils/authStorage';
import useTheme from '../../themes/useTheme';
import { testApiConnection } from '../../api/testConnection';

const ApiConfig = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [apiUrl, setApiUrl] = useState('');
  const [originalUrl, setOriginalUrl] = useState('');
  const [urlError, setUrlError] = useState('');
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<'success' | 'error' | 'warning' | 'info'>('info');

  // Load current API URL
  useEffect(() => {
    const loadApiUrl = async () => {
      try {
        const savedUrl = await getBaseUrl();
        if (savedUrl) {
          setApiUrl(savedUrl);
          setOriginalUrl(savedUrl);
        }
      } catch (error) {
        console.error('Error loading API URL:', error);
      }
    };
    
    loadApiUrl();
  }, []);

  // Validate URL
  const validateUrl = (url: string) => {
    if (!url) {
      setUrlError(t('settings.apiUrlRequired'));
      return false;
    }
    
    try {
      // Simple URL validation
      new URL(url);
      setUrlError('');
      return true;
    } catch (error) {
      setUrlError(t('settings.invalidApiUrl'));
      return false;
    }
  };

  // Save API URL
  const saveApiUrl = async () => {
    if (validateUrl(apiUrl)) {
      try {
        await saveBaseUrl(apiUrl);
        setAlertType('success');
        setAlertMessage(t('settings.apiUrlSaved'));
        setAlertVisible(true);
        
        // Navigate back after a short delay
        setTimeout(() => {
          router.back();
        }, 1500);
      } catch (error) {
        console.error('Error saving API URL:', error);
        setAlertType('error');
        setAlertMessage(t('settings.apiUrlSaveError'));
        setAlertVisible(true);
      }
    }
  };

  // Reset to original URL
  const resetUrl = () => {
    setApiUrl(originalUrl);
    setUrlError('');
  };

  // Test connection to API
  const testConnection = async () => {
    if (!validateUrl(apiUrl)) {
      return;
    }

    try {
      setAlertType('info');
      setAlertMessage(t('settings.testingConnection'));
      setAlertVisible(true);

      // Use the testApiConnection function
      const result = await testApiConnection(apiUrl);
      
      if (result.success) {
        setAlertType('success');
        setAlertMessage(t('settings.connectionSuccessful'));
      } else {
        setAlertType('warning');
        setAlertMessage(t('settings.connectionFailed') + ' ' + result.message);
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      setAlertType('error');
      setAlertMessage(t('settings.connectionError'));
    } finally {
      setAlertVisible(true);
    }
  };

  // Reset to default URL
  const resetToDefault = () => {
    Alert.alert(
      t('settings.resetToDefaultTitle'),
      t('settings.resetToDefaultMessage'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel'
        },
        {
          text: t('common.reset'),
          onPress: () => {
            const defaultUrl = 'http://training.mcsb-pg.com/apps/api'; // Updated default URL
            setApiUrl(defaultUrl);
            setUrlError('');
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { 
      backgroundColor: theme.colors.background.primary,
      paddingTop: 10
    }]}>
      <AlertMessage
        visible={alertVisible}
        type={alertType}
        message={alertMessage}
        onClose={() => setAlertVisible(false)}
      />
      
      <View style={[styles.header, { 
        borderBottomColor: theme.colors.border.medium,
        marginTop: 10
      }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
          <Text style={[styles.backButtonText, { color: theme.colors.text.primary }]}>
            {t('common.back')}
          </Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>
          {t('settings.apiConfig')}
        </Text>
        <View style={styles.placeholder} />
      </View>
      
      <View style={styles.content}>
        <Card elevation={3} style={[styles.card, { backgroundColor: theme.colors.card.background }]}>
          <Text style={[styles.description, { color: theme.colors.text.secondary }]}>
            {t('settings.apiConfigDescription')}
          </Text>
          
          <InputField
            label={t('settings.apiUrl')}
            placeholder="https://api.example.com"
            value={apiUrl}
            onChangeText={(text) => {
              setApiUrl(text);
              if (urlError) validateUrl(text);
            }}
            autoCapitalize="none"
            keyboardType="url"
            leftIcon="link-outline"
            error={urlError}
          />
          
          {/* Primary action buttons */}
          <View style={styles.buttonContainer}>
            <Button 
              title={t('common.save')}
              onPress={saveApiUrl}
              style={styles.button}
              size="medium"
            />
            
            <Button 
              title={t('settings.testConnection')}
              onPress={testConnection}
              style={styles.button}
              variant="secondary"
              size="medium"
            />
          </View>
          
          {/* Secondary action buttons */}
          <View style={styles.buttonContainer}>
            <Button 
              title={t('settings.resetToDefault')}
              onPress={resetToDefault}
              style={styles.button}
              variant="outline"
              size="medium"
            />
            
            <Button 
              title={t('common.reset')}
              onPress={resetUrl}
              style={styles.button}
              variant="outline"
              size="medium"
            />
          </View>
        </Card>
        
        <Card elevation={2} style={[styles.infoCard, { backgroundColor: theme.colors.card.background }]}>
          <View style={styles.infoHeader}>
            <Ionicons name="information-circle" size={22} color={theme.colors.status.info} />
            <Text style={[styles.infoTitle, { color: theme.colors.text.primary }]}>
              {t('settings.apiConfigInfo')}
            </Text>
          </View>
          
          <Text style={[styles.infoText, { color: theme.colors.text.secondary }]}>
            {t('settings.apiConfigInfoDescription')}
          </Text>
          
          <View style={[styles.tipContainer, { 
            backgroundColor: `${theme.colors.status.warning}10`,
            borderLeftColor: theme.colors.status.warning
          }]}>
            <Ionicons name="bulb-outline" size={18} color={theme.colors.status.warning} />
            <Text style={[styles.tipText, { color: theme.colors.text.primary }]}>
              {t('settings.apiConfigTip')}
            </Text>
          </View>
        </Card>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  backButtonText: {
    marginLeft: 4,
    fontSize: 14,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 60,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    padding: 20,
    marginBottom: 16,
  },
  description: {
    fontSize: 14,
    marginBottom: 20,
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  button: {
    flex: 1,
    marginHorizontal: 4,
  },
  infoCard: {
    padding: 16,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  tipContainer: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
  },
  tipText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  }
});

export default ApiConfig;