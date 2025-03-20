import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView,
  TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import useTheme from '../../themes/useTheme';

import AlertMessage from '../../components/AlertMessage';

const SettingScreen = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [searchText, setSearchText] = useState('');
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<'success' | 'error' | 'warning' | 'info'>('info');

  // Navigate to Language Selector
  const navigateToLanguage = () => {
    router.push('./LanguageSelector');
  };

  // Navigate to Theme Switcher
  const navigateToTheme = () => {
    router.push('./ThemeSwitcher');
  };

  // Navigate to API Config
  const navigateToApiConfig = () => {
    router.push('./ApiConfig');
  };

  // Navigate to Clear Cache
  const navigateToClearCache = () => {
    router.push('./ClearCache');
  };

  // Navigate to About App
  const navigateToAbout = () => {
    router.push('./AboutApp');
  };

  // Filter settings based on search text
  const filterSettings = (settingName: string) => {
    if (!searchText) return true;
    return settingName.toLowerCase().includes(searchText.toLowerCase());
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      <AlertMessage
        visible={alertVisible}
        type={alertType}
        message={alertMessage}
        onClose={() => setAlertVisible(false)}
      />
      
      <View style={[styles.header, { borderBottomColor: theme.colors.border.medium }]}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={[styles.backButton, { backgroundColor: theme.colors.card.background }]}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>
          {t('settings.title')}
        </Text>
        <View style={styles.placeholder} />
      </View>
      
      <View style={[styles.searchContainer, { 
        backgroundColor: theme.colors.card.background,
        borderColor: theme.colors.border.medium 
      }]}>
        <Ionicons name="search" size={20} color={theme.colors.text.secondary} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: theme.colors.text.primary }]}
          placeholder={t('settings.searchPlaceholder')}
          placeholderTextColor={theme.colors.text.secondary}
          value={searchText}
          onChangeText={setSearchText}
        />
        {searchText ? (
          <TouchableOpacity onPress={() => setSearchText('')}>
            <Ionicons name="close-circle" size={20} color={theme.colors.text.secondary} />
          </TouchableOpacity>
        ) : null}
      </View>
      
      <ScrollView style={styles.scrollView}>
        {/* Language Section */}
        {filterSettings(t('settings.language')) && (
          <TouchableOpacity 
            style={[styles.settingItem, { 
              backgroundColor: theme.colors.card.background,
              borderColor: theme.colors.border.medium 
            }]}
            onPress={navigateToLanguage}
          >
            <View style={[styles.settingIconContainer, { backgroundColor: 'rgba(52, 152, 219, 0.1)' }]}>
              <Ionicons name="language" size={24} color={theme.colors.primary} />
            </View>
            <View style={styles.settingTextContainer}>
              <Text style={[styles.settingTitle, { color: theme.colors.text.primary }]}>
                {t('settings.language')}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.text.secondary} />
          </TouchableOpacity>
        )}
        
        {/* Theme Section */}
        {filterSettings(t('settings.theme')) && (
          <TouchableOpacity 
            style={[styles.settingItem, { 
              backgroundColor: theme.colors.card.background,
              borderColor: theme.colors.border.medium 
            }]}
            onPress={navigateToTheme}
          >
            <View style={[styles.settingIconContainer, { backgroundColor: 'rgba(52, 152, 219, 0.1)' }]}>
              <Ionicons name="contrast" size={24} color={theme.colors.primary} />
            </View>
            <View style={styles.settingTextContainer}>
              <Text style={[styles.settingTitle, { color: theme.colors.text.primary }]}>
                {t('settings.theme')}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.text.secondary} />
          </TouchableOpacity>
        )}
        
        {/* API URL Section */}
        {filterSettings(t('settings.apiUrl')) && (
          <TouchableOpacity 
            style={[styles.settingItem, { 
              backgroundColor: theme.colors.card.background,
              borderColor: theme.colors.border.medium 
            }]}
            onPress={navigateToApiConfig}
          >
            <View style={[styles.settingIconContainer, { backgroundColor: 'rgba(52, 152, 219, 0.1)' }]}>
              <Ionicons name="link" size={24} color={theme.colors.primary} />
            </View>
            <View style={styles.settingTextContainer}>
              <Text style={[styles.settingTitle, { color: theme.colors.text.primary }]}>
                {t('settings.apiUrl')}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.text.secondary} />
          </TouchableOpacity>
        )}
        
        {/* Clear Cache Section */}
        {filterSettings(t('settings.clearCache')) && (
          <TouchableOpacity 
            style={[styles.settingItem, { 
              backgroundColor: theme.colors.card.background,
              borderColor: theme.colors.border.medium 
            }]}
            onPress={navigateToClearCache}
          >
            <View style={[styles.settingIconContainer, { backgroundColor: 'rgba(52, 152, 219, 0.1)' }]}>
              <Ionicons name="trash-bin" size={24} color={theme.colors.primary} />
            </View>
            <View style={styles.settingTextContainer}>
              <Text style={[styles.settingTitle, { color: theme.colors.text.primary }]}>
                {t('settings.clearCache')}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.text.secondary} />
          </TouchableOpacity>
        )}
        
        {/* About App Section */}
        {filterSettings(t('settings.about')) && (
          <TouchableOpacity 
            style={[styles.settingItem, { 
              backgroundColor: theme.colors.card.background,
              borderColor: theme.colors.border.medium 
            }]}
            onPress={navigateToAbout}
          >
            <View style={[styles.settingIconContainer, { backgroundColor: 'rgba(52, 152, 219, 0.1)' }]}>
              <Ionicons name="information-circle" size={24} color={theme.colors.primary} />
            </View>
            <View style={styles.settingTextContainer}>
              <Text style={[styles.settingTitle, { color: theme.colors.text.primary }]}>
                {t('settings.about')}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.text.secondary} />
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 10, // Add padding to the top of the container
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16, // Increase vertical padding
    borderBottomWidth: 1,
    marginTop: 10, // Add margin to the top of the header
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40, // Match the width of the back button
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    margin: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default SettingScreen;