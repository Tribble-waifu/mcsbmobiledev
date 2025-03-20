import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Card from '../../components/Card';
import AlertMessage from '../../components/CustomAlert';
import { saveTheme, getTheme } from '../../utils/settingsStorage';
import useTheme from '../../themes/useTheme';

interface ThemeSwitcherProps {
  onThemeChange?: (message?: string) => void;
}

const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ onThemeChange }) => {
  const { t } = useTranslation();
  const { theme, isDark, setTheme } = useTheme();
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [selectedTheme, setSelectedTheme] = useState<'light' | 'dark' | 'system'>(
    isDark ? 'dark' : 'light'
  );
  
  // Toggle theme handler
  const changeTheme = async (value: 'light' | 'dark' | 'system') => {
    try {
      setSelectedTheme(value);
      
      // Apply theme based on selection
      if (value === 'light') {
        setTheme(false);
      } else if (value === 'dark') {
        setTheme(true);
      } else {
        // For system theme, we would typically check the device theme
        // For now, we'll default to light
        setTheme(false);
      }
      
      // Show success message
      const message = t('settings.themeChanged');
      if (onThemeChange) {
        onThemeChange(message);
      } else {
        setAlertMessage(message);
        setAlertVisible(true);
      }
    } catch (error) {
      console.error('Error changing theme:', error);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background.primary, paddingTop: 10 }]}>
      <AlertMessage
        visible={alertVisible}
        type="success"
        message={alertMessage}
        onClose={() => setAlertVisible(false)}
        showConfirmButton={false}
        duration={2000}
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
          {t('settings.appearance')}
        </Text>
        <View style={styles.placeholder} />
      </View>
      
      <ScrollView style={styles.scrollView}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text.secondary }]}>
          {t('settings.chooseTheme')}
        </Text>
        
        <Card style={[styles.themeCard, { backgroundColor: theme.colors.card.background }]}>
          {/* Light Theme Option */}
          <TouchableOpacity 
            style={[
              styles.themeOption, 
              { borderColor: theme.colors.border.medium },
              selectedTheme === 'light' && [
                styles.selectedTheme, 
                { borderColor: theme.colors.primary, backgroundColor: `${theme.colors.primary}10` }
              ]
            ]}
            onPress={() => changeTheme('light')}
          >
            <View style={styles.themeContent}>
              <View style={[styles.themeIconContainer, { backgroundColor: 'rgba(255, 152, 0, 0.1)' }]}>
                <Ionicons name="sunny" size={24} color="#FF9800" />
              </View>
              <View style={styles.themeTextContainer}>
                <Text style={[styles.themeText, { color: theme.colors.text.primary }]}>
                  {t('settings.lightTheme')}
                </Text>
              </View>
            </View>
            {selectedTheme === 'light' && (
              <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />
            )}
          </TouchableOpacity>
          
          {/* Dark Theme Option */}
          <TouchableOpacity 
            style={[
              styles.themeOption, 
              { borderColor: theme.colors.border.medium },
              selectedTheme === 'dark' && [
                styles.selectedTheme, 
                { borderColor: theme.colors.primary, backgroundColor: `${theme.colors.primary}10` }
              ]
            ]}
            onPress={() => changeTheme('dark')}
          >
            <View style={styles.themeContent}>
              <View style={[styles.themeIconContainer, { backgroundColor: 'rgba(52, 73, 94, 0.1)' }]}>
                <Ionicons name="moon" size={24} color="#34495e" />
              </View>
              <View style={styles.themeTextContainer}>
                <Text style={[styles.themeText, { color: theme.colors.text.primary }]}>
                  {t('settings.darkTheme')}
                </Text>
              </View>
            </View>
            {selectedTheme === 'dark' && (
              <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />
            )}
          </TouchableOpacity>
          
          {/* System Default Theme Option */}
          <TouchableOpacity 
            style={[
              styles.themeOption, 
              { borderColor: theme.colors.border.medium },
              selectedTheme === 'system' && [
                styles.selectedTheme, 
                { borderColor: theme.colors.primary, backgroundColor: `${theme.colors.primary}10` }
              ]
            ]}
            onPress={() => changeTheme('system')}
          >
            <View style={styles.themeContent}>
              <View style={[styles.themeIconContainer, { backgroundColor: 'rgba(52, 152, 219, 0.1)' }]}>
                <Ionicons name="phone-portrait" size={24} color="#3498db" />
              </View>
              <View style={styles.themeTextContainer}>
                <Text style={[styles.themeText, { color: theme.colors.text.primary }]}>
                  {t('settings.defaultTheme')}
                </Text>
              </View>
            </View>
            {selectedTheme === 'system' && (
              <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />
            )}
          </TouchableOpacity>
        </Card>
        
        <Text style={[styles.themeDescription, { 
          color: theme.colors.text.secondary,
          backgroundColor: `${theme.colors.primary}10`
        }]}>
          {t('settings.themeDescription')}
        </Text>
      </ScrollView>
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
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 16,
  },
  themeCard: {
    padding: 16,
    borderRadius: 12,
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
  },
  selectedTheme: {
    // Base styles for selected theme - colors applied inline
  },
  themeContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  themeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  themeTextContainer: {
    flexDirection: 'column',
  },
  themeText: {
    fontSize: 16,
    fontWeight: '500',
  },
  themeDescription: {
    fontSize: 14,
    fontStyle: 'italic',
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
    padding: 12,
    borderRadius: 8,
  }
});

export default ThemeSwitcher;