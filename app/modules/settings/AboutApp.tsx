import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView,
  Image,
  Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import Constants from 'expo-constants';

const AboutApp = () => {
  const { t } = useTranslation();
  const appVersion = Constants.expoConfig?.version || '1.0.0';
  
  const openWebsite = () => {
    Linking.openURL('https://example.com');
  };
  
  const openPrivacyPolicy = () => {
    Linking.openURL('https://example.com/privacy');
  };
  
  const openTermsOfService = () => {
    Linking.openURL('https://example.com/terms');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
          <Text style={styles.backButtonText}>{t('common.back')}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('settings.about')}</Text>
        <View style={styles.placeholder} />
      </View>
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.logoContainer}>
          <Image 
            source={require('../../../assets/images/logo/mcsb.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.appName}>MCSB Mobile App</Text>
          <Text style={styles.versionText}>Version {appVersion}</Text>
        </View>
        
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>{t('about.description')}</Text>
          <Text style={styles.descriptionText}>
            MCSB Mobile App is a comprehensive mobile application designed to provide users with 
            a seamless experience for managing their tasks and accessing important information on the go.
          </Text>
        </View>
        
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>{t('about.features')}</Text>
          
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={20} color="#3498db" style={styles.featureIcon} />
            <Text style={styles.featureText}>User-friendly interface</Text>
          </View>
          
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={20} color="#3498db" style={styles.featureIcon} />
            <Text style={styles.featureText}>Multi-language support</Text>
          </View>
          
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={20} color="#3498db" style={styles.featureIcon} />
            <Text style={styles.featureText}>Dark mode support</Text>
          </View>
          
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={20} color="#3498db" style={styles.featureIcon} />
            <Text style={styles.featureText}>QR code scanning</Text>
          </View>
        </View>
        
        <View style={styles.linksContainer}>
          <TouchableOpacity style={styles.linkItem} onPress={openWebsite}>
            <Ionicons name="globe-outline" size={20} color="#3498db" style={styles.linkIcon} />
            <Text style={styles.linkText}>{t('about.visitWebsite')}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.linkItem} onPress={openPrivacyPolicy}>
            <Ionicons name="shield-checkmark-outline" size={20} color="#3498db" style={styles.linkIcon} />
            <Text style={styles.linkText}>{t('about.privacyPolicy')}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.linkItem} onPress={openTermsOfService}>
            <Ionicons name="document-text-outline" size={20} color="#3498db" style={styles.linkIcon} />
            <Text style={styles.linkText}>{t('about.termsOfService')}</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.copyrightContainer}>
          <Text style={styles.copyrightText}>© {new Date().getFullYear()} MCSB. All rights reserved.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  backButtonText: {
    marginLeft: 4,
    color: '#333',
    fontSize: 14,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 60,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  logoContainer: {
    alignItems: 'center',
    marginVertical: 24,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 16,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  versionText: {
    fontSize: 16,
    color: '#666',
  },
  sectionContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e1e1e1',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureIcon: {
    marginRight: 8,
  },
  featureText: {
    fontSize: 16,
    color: '#333',
  },
  linksContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e1e1e1',
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  linkIcon: {
    marginRight: 12,
  },
  linkText: {
    fontSize: 16,
    color: '#3498db',
  },
  copyrightContainer: {
    alignItems: 'center',
    marginVertical: 24,
  },
  copyrightText: {
    fontSize: 14,
    color: '#666',
  },
});

export default AboutApp;