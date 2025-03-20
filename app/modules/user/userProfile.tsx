import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Stack, router, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import useTheme from '../../themes/useTheme';
import Card from '../../components/Card';
import LoadingIndicator from '../../components/LoadingIndicator';
import AlertMessage from '../../components/AlertMessage';
// Update these imports
import { getUserProfile, saveUserProfile, UserProfile } from '../../utils/userStorage';
import { fetchUserProfile } from '../../api/userApi';
import { getUserToken } from '../../utils/authStorage';
import { getEmployeeId } from '../../utils/employeeStorage';

const UserProfileScreen: React.FC = () => {
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertType, setAlertType] = useState<'success' | 'error' | 'warning' | 'info'>('info');
  const [alertMessage, setAlertMessage] = useState('');
  const [employeeId, setEmployeeId] = useState<number | null>(null);

  useEffect(() => {
    const loadEmployeeId = async () => {
      try {
        // Get the employee_id directly from employeeStorage
        const id = await getEmployeeId();
        
        if (id) {
          setEmployeeId(Number(id));
          return Number(id);
        }
        
        throw new Error('Employee ID not found');
      } catch (error) {
        console.error('Error loading employee ID:', error);
        showAlert('error', t('profile.idError') || 'Employee ID not found. Please log in again.');
        return null;
      }
    };

    const loadProfile = async () => {
      try {
        setLoading(true);
        
        // First check if we have cached profile data
        const cachedProfile = await getUserProfile();
        if (cachedProfile) {
          setProfile(cachedProfile);
        }
        
        const id = await loadEmployeeId();
        if (!id) {
          // If no ID is found, don't try to fetch profile
          setLoading(false);
          return;
        }
        
        // Fetch fresh profile data from API
        const profileData = await fetchUserProfile(id);
        setProfile(profileData);
        await saveUserProfile(profileData);
        
      } catch (error) {
        console.error('Error fetching user profile:', error);
        showAlert('error', t('profile.fetchError') || 'Failed to fetch profile data');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const refreshProfile = async () => {
    try {
      if (!employeeId) {
        showAlert('error', t('profile.idError') || 'Employee ID not found. Please log in again.');
        return;
      }
      
      setLoading(true);
      const profileData = await fetchUserProfile(employeeId);
      setProfile(profileData);
      await saveUserProfile(profileData);
      showAlert('success', t('profile.refreshSuccess') || 'Profile data refreshed successfully');
    } catch (error) {
      console.error('Error refreshing user profile:', error);
      showAlert('error', t('profile.refreshError') || 'Failed to refresh profile data');
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (type: 'success' | 'error' | 'warning' | 'info', message: string) => {
    setAlertType(type);
    setAlertMessage(message);
    setAlertVisible(true);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const renderProfileItem = (label: string, value: string | number | boolean) => {
    let displayValue = value;
    
    if (typeof value === 'boolean') {
      displayValue = value ? 'Yes' : 'No';
    }
    
    return (
      <View style={styles.profileItem}>
        <Text style={[styles.profileLabel, { color: theme.colors.text.secondary }]}>
          {label}
        </Text>
        <Text style={[styles.profileValue, { color: theme.colors.text.primary }]}>
          {displayValue || '-'}
        </Text>
      </View>
    );
  };

  if (loading && !profile) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background.primary }]}>
        <LoadingIndicator size={100} showText={true} />
      </View>
    );
  }

  // Handle back navigation
  const handleGoBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      router.replace('/');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      {/* Custom header with more visible back button */}
      <View style={[styles.customHeader, { backgroundColor: theme.colors.background.primary }]}>
        <TouchableOpacity 
          onPress={handleGoBack} 
          style={[styles.backButton, { backgroundColor: theme.colors.primary + '20' }]}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>
          {t('profile.title') || 'User Profile'}
        </Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Card style={styles.profileHeaderCard} elevation={2} borderRadius={16}>
          <View style={styles.profileHeader}>
            <View style={[styles.avatarContainer, { backgroundColor: theme.colors.primary + '20' }]}>
              <Ionicons name="person" size={60} color={theme.colors.primary} />
            </View>
            <View style={styles.profileHeaderInfo}>
              <Text style={[styles.profileName, { color: theme.colors.text.primary }]}>
                {profile?.name || ''}
              </Text>
              <Text style={[styles.profileId, { color: theme.colors.text.secondary }]}>
                {t('profile.employeeId')}: {profile?.employeeNumber || ''}
              </Text>
            </View>
          </View>
        </Card>

        <Card style={styles.profileDetailsCard} elevation={2} borderRadius={16}>
          <View style={styles.sectionHeader}>
            <Ionicons name="information-circle-outline" size={24} color={theme.colors.primary} />
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
              {t('profile.personalInfo') || 'Personal Information'}
            </Text>
          </View>

          {renderProfileItem(t('profile.title') || 'Title', profile?.title || '')}
          {renderProfileItem(t('profile.gender') || 'Gender', profile?.gender || '')}
          {renderProfileItem(t('profile.dateOfBirth') || 'Date of Birth', formatDate(profile?.dateOfBirth || ''))}
          {renderProfileItem(t('profile.age') || 'Age', profile?.age || 0)}
          {renderProfileItem(t('profile.maritalStatus') || 'Marital Status', profile?.maritalStatus || '')}
          {renderProfileItem(t('profile.nationality') || 'Nationality', profile?.nationality || '')}
          {renderProfileItem(t('profile.nric') || 'NRIC', profile?.nric || '')}
          {profile?.passport && renderProfileItem(t('profile.passport') || 'Passport', profile?.passport)}
        </Card>

        <Card style={styles.profileDetailsCard} elevation={2} borderRadius={16}>
          <View style={styles.sectionHeader}>
            <Ionicons name="people-outline" size={24} color={theme.colors.primary} />
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
              {t('profile.demographicInfo') || 'Demographic Information'}
            </Text>
          </View>

          {renderProfileItem(t('profile.religion') || 'Religion', profile?.religion || '')}
          {renderProfileItem(t('profile.ethnic') || 'Ethnicity', profile?.ethnic || '')}
          {renderProfileItem(t('profile.resident') || 'Resident Status', profile?.resident || '')}
          {renderProfileItem(t('profile.birthPlace') || 'Birth Place', profile?.birthPlace || '')}
          {renderProfileItem(t('profile.bloodGroup') || 'Blood Group', profile?.bloodGroup || '')}
          {renderProfileItem(t('profile.smoker') || 'Smoker', profile?.smoker || false)}
        </Card>

        <TouchableOpacity 
          style={[styles.refreshButton, { backgroundColor: theme.colors.primary }]}
          onPress={refreshProfile}
        >
          <Ionicons name="refresh" size={20} color={theme.colors.text.inverse} />
          <Text style={[styles.refreshButtonText, { color: theme.colors.text.inverse }]}>
            {t('profile.refreshData') || 'Refresh Data'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <AlertMessage
        visible={alertVisible}
        type={alertType}
        message={alertMessage}
        onClose={() => setAlertVisible(false)}
        duration={3000}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50, // Adjust for status bar
    paddingBottom: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 10,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerRight: {
    width: 44, // Same width as back button for balanced layout
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  profileHeaderCard: {
    marginBottom: 16,
    padding: 0,
    overflow: 'hidden',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileHeaderInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  profileId: {
    fontSize: 16,
  },
  profileDetailsCard: {
    marginBottom: 16,
    padding: 0,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  profileItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  profileLabel: {
    fontSize: 16,
    flex: 1,
  },
  profileValue: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 8,
    marginBottom: 24,
  },
  refreshButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default UserProfileScreen;