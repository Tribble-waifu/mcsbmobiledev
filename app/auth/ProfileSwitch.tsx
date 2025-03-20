import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image } from 'react-native';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import Card from '../components/Card';
import AlertMessage from '../components/AlertMessage';
import LoadingIndicator from '../components/LoadingIndicator';
import useTheme from '../themes/useTheme';
import { 
  saveUserId, 
  saveCompanyId,
  saveUserRoles
} from '../utils/authStorage';
import { saveEmployeeInfoFromToken } from '../utils/employeeStorage';

// Import API functions from loginApi
import { getUserProfiles, getUserToken, getModuleAccess } from '../api/loginApi';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define interfaces for the API response
interface Company {
  companyId: number;
  name: string;
}

interface UserProfile {
  userId: number;
  username: string;
  description: string;
  userRole: string;
  companies: Company[];
}

export default function ProfileSwitch() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<'success' | 'error' | 'warning' | 'info'>('info');

  useEffect(() => {
    fetchUserProfiles();
  }, []);

  const fetchUserProfiles = async () => {
    try {
      setLoading(true);
      
      const response = await getUserProfiles();
      
      if (response.success && response.data) {
        setProfiles(response.data);
      } else {
        setError(response.message || 'Failed to load profiles');
      }
    } catch (error) {
      console.error('Error fetching profiles:', error);
      setError('An error occurred while fetching profiles');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSelect = async (profile: UserProfile) => {
    try {
      if (!profile.companies || profile.companies.length === 0) {
        setAlertType('error');
        setAlertMessage('No company associated with this profile');
        setAlertVisible(true);
        return;
      }
  
      // Save the selected userId
      await saveUserId(profile.userId.toString());
      
      // Save the company ID
      const companyId = profile.companies[0].companyId;
      await saveCompanyId(companyId.toString());
      
      setLoading(true);
      
      // Get user token using the imported function
      const tokenResponse = await getUserToken(profile.userId, companyId);
      
      if (!tokenResponse.success) {
        throw new Error(tokenResponse.message || 'Failed to get user token');
      }
      
      // Extract roles from the profile
      const roles = [profile.userRole];
      await saveUserRoles(roles);
      
      // Decode and save employee information from the token
      if (tokenResponse.data && tokenResponse.data.token) {
        const saveResult = await saveEmployeeInfoFromToken(tokenResponse.data.token);
        
        // Add console logging to show the decoded token
        try {
          const { jwtDecode } = require('jwt-decode');
          const decodedToken = jwtDecode(tokenResponse.data.token);
          console.log('Decoded JWT Token:', JSON.stringify(decodedToken, null, 2));
        } catch (decodeError) {
          console.error('Error decoding token for logging:', decodeError);
        }
        
        if (!saveResult) {
          console.warn('Failed to save employee information from token');
        }
      }
      
      // Fetch module access permissions
      const moduleAccessResponse = await getModuleAccess();
      
      if (!moduleAccessResponse.success) {
        console.warn('Failed to fetch module access:', moduleAccessResponse.message);
        // Continue anyway as this is not critical
      } else {
        console.log('Module access fetched successfully');
        // You can store module access in AsyncStorage or context if needed
        const moduleData = moduleAccessResponse.data;
        
        // Example of how you could use this data:
        const moduleAccess = {
          applyLeave: moduleData.ApplyLeave?.access || false,
          clockInOut: moduleData.ETimesheetClockTimeApplication?.access || false,
          overtime: moduleData.ETimesheetOvertimeApplication?.access || false,
          noticeBoard: moduleData.NoticeBoard?.access || false,
          payslip: moduleData.ProfilePayslip?.access || false,
          leaveApplication: moduleData.LeaveApplicationListing?.access || false,
          leaveBalance: moduleData.ProfileLeaveBalance?.access || false,
          pendingLeave: moduleData.LeavePendingApplicationListing?.access || false,
          overtimeApproval: moduleData.PendingOvertimeApplicationListing?.access || false,
          pendingTimeLog: moduleData.PendingClockTimeApplicationListing?.access || false,
          timesheet: moduleData.Etimesheet?.access || false
        };
        
        console.log('Access permissions:', moduleAccess);
        
        // Save module access to AsyncStorage
        await AsyncStorage.setItem('moduleAccess', JSON.stringify(moduleAccess));
        await AsyncStorage.setItem('accessPermissions', JSON.stringify(moduleAccess));
      }
      
      // Show success message
      setAlertType('success');
      setAlertMessage(`Profile selected: ${profile.description}`);
      setAlertVisible(true);
      
      // Navigate to appropriate menu based on user role after a short delay
      setTimeout(() => {
        if (profile.userRole.toLowerCase() === 'approval') {
          router.replace('/role/approvalMenu');
        } else {
          router.replace('/role/employeeMenu'); // This matches the actual filename
        }
      }, 1500);
    } catch (error) {
      console.error('Error selecting profile:', error);
      setAlertType('error');
      setAlertMessage('Failed to select profile');
      setAlertVisible(true);
      setLoading(false);
    }
  };

  const renderProfileItem = ({ item }: { item: UserProfile }) => (
    <TouchableOpacity 
      style={[styles.profileCard, { backgroundColor: theme.colors.card.background }]}
      onPress={() => handleProfileSelect(item)}
    >
      <View style={styles.profileContent}>
        <View style={styles.profileIconContainer}>
          <Ionicons 
            name="person-circle" 
            size={50} 
            color={theme.colors.primary} 
          />
        </View>
        <View style={styles.profileInfo}>
          <Text style={[styles.profileName, { color: theme.colors.text.primary }]}>
            {item.description}
          </Text>
          <Text style={[styles.profileRole, { color: theme.colors.text.secondary }]}>
            {item.userRole}
          </Text>
          {item.companies && item.companies.length > 0 && (
            <Text style={[styles.companyName, { color: theme.colors.text.secondary }]}>
              {item.companies[0].name}
            </Text>
          )}
        </View>
        <Ionicons 
          name="chevron-forward" 
          size={24} 
          color={theme.colors.text.secondary} 
        />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      <Stack.Screen 
        options={{
          headerShown: false,
        }}
      />
      
      <AlertMessage
        visible={alertVisible}
        type={alertType}
        message={alertMessage}
        onClose={() => setAlertVisible(false)}
      />

      <View style={styles.header}>
        <Image 
          source={require('../../assets/images/logo/mcsb.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={[styles.title, { color: theme.colors.text.primary }]}>
          {t('profile.selectProfile')}
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}>
          {t('profile.chooseProfileToAccess')}
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <LoadingIndicator 
            size={60}
            // Remove these color props to use the default colors
            // primaryColor={theme.colors.primary}
            // secondaryColor={theme.colors.secondary}
            duration={600}
            showText={true}
          />
        </View>
      ) : error ? (
        <Card style={styles.errorCard}>
          <Ionicons name="alert-circle" size={40} color={theme.colors.accent} />
          <Text style={[styles.errorText, { color: theme.colors.accent }]}>
            {error}
          </Text>
          <TouchableOpacity 
            style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
            onPress={fetchUserProfiles}
          >
            <Text style={[styles.retryButtonText, { color: theme.colors.text.inverse }]}>
              {t('common.retry')}
            </Text>
          </TouchableOpacity>
        </Card>
      ) : profiles.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Ionicons name="person-outline" size={40} color={theme.colors.text.secondary} />
          <Text style={[styles.emptyText, { color: theme.colors.text.secondary }]}>
            {t('profile.noProfilesFound')}
          </Text>
        </Card>
      ) : (
        <FlatList
          data={profiles}
          renderItem={renderProfileItem}
          keyExtractor={(item) => item.userId.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

// Add the StyleSheet definition here
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 30,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    paddingBottom: 20,
  },
  profileCard: {
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  profileContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileIconContainer: {
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  profileRole: {
    fontSize: 14,
    marginBottom: 4,
  },
  companyName: {
    fontSize: 14,
  },
  errorCard: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 16,
  },
  retryButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyCard: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
  }
});