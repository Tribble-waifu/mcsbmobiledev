import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView,
  ScrollView,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { saveLanguage, getLanguage } from '../../utils/settingsStorage';
import AlertMessage from '../../components/CustomAlert';
import useTheme from '../../themes/useTheme';

interface LanguageSelectorProps {
  onLanguageChange?: (message?: string) => void;
}

interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ onLanguageChange }) => {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  const languages: LanguageOption[] = [
    {
      code: 'en',
      name: 'English',
      nativeName: 'English'
    },
    {
      code: 'ms',
      name: 'Malay',
      nativeName: 'Bahasa Melayu'
    },
    {
      code: 'zhs',
      name: 'Chinese (Simplified)',
      nativeName: '简体中文'
    },
    {
      code: 'zht',
      name: 'Chinese (Traditional)',
      nativeName: '繁體中文'
    }
  ];

  // Load saved language on component mount
  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const savedLanguage = await getLanguage();
        if (savedLanguage) {
          setCurrentLanguage(savedLanguage);
          i18n.changeLanguage(savedLanguage);
        }
      } catch (error) {
        console.error('Error loading language setting:', error);
      }
    };
    
    loadLanguage();
  }, [i18n]);

  // Change language handler
  const changeLanguage = async (lang: string) => {
    try {
      if (lang === currentLanguage) return;
      
      await saveLanguage(lang);
      i18n.changeLanguage(lang);
      setCurrentLanguage(lang);
      
      // Show success message
      if (onLanguageChange) {
        onLanguageChange(t('settings.languageChanged'));
      } else {
        setAlertMessage(t('settings.languageChanged'));
        setAlertVisible(true);
      }
      
      // Navigate back after a short delay to allow the user to see the language change
      setTimeout(() => {
        router.back();
      }, 2000);
    } catch (error) {
      console.error('Error changing language:', error);
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
          {t('settings.language')}
        </Text>
        <View style={styles.placeholder} />
      </View>
      
      <ScrollView style={styles.scrollView}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text.secondary }]}>
          {t('settings.selectLanguage')}
        </Text>
        
        {languages.map((language) => (
          <TouchableOpacity 
            key={language.code}
            style={[
              styles.languageOption, 
              { 
                backgroundColor: theme.colors.card.background,
                borderColor: theme.colors.border.medium
              },
              currentLanguage === language.code && [
                styles.selectedLanguage, 
                { 
                  borderColor: theme.colors.primary,
                  backgroundColor: `${theme.colors.primary}10` // 10% opacity
                }
              ]
            ]}
            onPress={() => changeLanguage(language.code)}
          >
            <View style={styles.languageContent}>
              <View style={styles.languageTextContainer}>
                <Text style={[styles.languageName, { color: theme.colors.text.primary }]}>
                  {language.name}
                </Text>
                <Text style={[styles.languageNativeName, { color: theme.colors.text.secondary }]}>
                  {language.nativeName}
                </Text>
              </View>
            </View>
            
            {currentLanguage === language.code && (
              <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />
            )}
          </TouchableOpacity>
        ))}
        
        <Text style={[styles.note, { 
          color: theme.colors.text.secondary,
          backgroundColor: `${theme.colors.primary}10` // 10% opacity
        }]}>
          {t('settings.languageNote')}
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
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
  },
  selectedLanguage: {
    // Base styles for selected language - colors applied inline
  },
  languageContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  languageTextContainer: {
    flexDirection: 'column',
  },
  languageName: {
    fontSize: 16,
    fontWeight: '500',
  },
  languageNativeName: {
    fontSize: 14,
    marginTop: 2,
  },
  note: {
    fontSize: 14,
    fontStyle: 'italic',
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
    padding: 8,
    borderRadius: 8,
  }
});

export default LanguageSelector;