import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, StatusBar, Platform } from 'react-native';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import useTheme from '../themes/useTheme';
import { clearAuthData, getUserToken, getBaseUrl } from '../utils/authStorage';
import { getEmployeeName, getCompanyName } from '../utils/employeeStorage';
import { getLanguage } from '../utils/settingsStorage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18next from 'i18next'; // Changed from '../i18n' to 'i18next'

// Import components
import Button from '../components/Button';
import Card from '../components/Card';
import AlertMessage from '../components/AlertMessage';
import LoadingIndicator from '../components/LoadingIndicator';

// Define interface for module access
interface ModuleAccess {
  access: boolean;
  create?: boolean;
  edit?: boolean;
  delete?: boolean;
  isAffectESS?: boolean;
}

interface ModuleAccessMap {
  [key: string]: ModuleAccess;
}

export default function EmployeeMenu() {
  const { t } = useTranslation();
  const { theme, isDark } = useTheme();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<'success' | 'error' | 'warning' | 'info'>('info');
  const [employeeName, setEmployeeName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [moduleAccess, setModuleAccess] = useState<ModuleAccessMap>({});

  // Load language settings and other data
  useEffect(() => {
    const loadLanguageAndData = async () => {
      try {
        // Load saved language from settingsStorage
        const savedLanguage = await getLanguage();
        if (savedLanguage) {
          // Apply the saved language using i18next instead of i18n
          i18next.changeLanguage(savedLanguage);
          console.log('Loaded saved language:', savedLanguage);
        }

        // Continue with loading other data
        const name = await getEmployeeName();
        const company = await getCompanyName();
        
        if (name) setEmployeeName(name);
        if (company) setCompanyName(company);
        
        // Load module access from AsyncStorage
        const moduleAccessData = await AsyncStorage.getItem('moduleAccess');
        
        if (moduleAccessData) {
          const parsedData = JSON.parse(moduleAccessData);
          setModuleAccess(parsedData);
        } else {
          // Fetch module access if not in AsyncStorage
          await fetchModuleAccess();
        }
        
        // Simulate loading for a better UX
        setTimeout(() => {
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error loading data:', error);
        setLoading(false);
      }
    };
    
    loadLanguageAndData();
  }, []);

  // Fetch module access from API
  const fetchModuleAccess = async () => {
    try {
      
      // Use the proper functions from authStorage.ts
      const userToken = await getUserToken();
      const baseUrl = await getBaseUrl();
      
      console.log('Debug - userToken exists:', !!userToken);
      console.log('Debug - baseUrl exists:', !!baseUrl);
      
      if (!userToken || !baseUrl) {
        console.error('User token or API URL not found');
        
        // Try to get module access directly from AsyncStorage as a fallback
        const accessPermissions = await AsyncStorage.getItem('accessPermissions');
        if (accessPermissions) {
          const permissions = JSON.parse(accessPermissions);
          setModuleAccess(permissions);
        }
        
        return;
      }
      
      // Rest of the function remains the same
      const response = await fetch(`${baseUrl}/v2/modules-access`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (data.success && data.data) {
        setModuleAccess(data.data);
        // Save to AsyncStorage for future use
        await AsyncStorage.setItem('moduleAccess', JSON.stringify(data.data));
        await AsyncStorage.setItem('accessPermissions', JSON.stringify(data.data));
      }
    } catch (error) {
      console.error('Error fetching module access:', error);
      
      // Try to get module access directly from AsyncStorage as a fallback
      const accessPermissions = await AsyncStorage.getItem('accessPermissions');
      if (accessPermissions) {
        const permissions = JSON.parse(accessPermissions);
        setModuleAccess(permissions);
      }
    }
  };

  // Check if a module is accessible
  const hasAccess = (moduleName: string): boolean => {
    
    // First check if we have the moduleAccess data
    if (Object.keys(moduleAccess).length === 0) {
      return false;
    }
    
    // Map of lowercase module keys to their actual keys in the data
    const moduleKeyMap: {[key: string]: string} = {
      'payslip': 'ProfilePayslip',
      'applyleave': 'ApplyLeave',
      'noticeboard': 'NoticeBoard',
      'clockinout': 'ETimesheetClockTimeApplication',
      'overtime': 'ETimesheetOvertimeApplication'
    };
    
    // Get the correct key for this module
    const moduleKey = moduleKeyMap[moduleName.toLowerCase()];
    
    if (moduleKey && moduleAccess[moduleKey]) {
      // Check if the value is a boolean or an object with access property
      if (typeof moduleAccess[moduleKey] === 'boolean') {
        return moduleAccess[moduleKey] as boolean;
      } else if (typeof moduleAccess[moduleKey] === 'object') {
        return moduleAccess[moduleKey].access === true;
      }
    }
    
    // If no mapping found, try to find a case-insensitive match
    if (moduleAccess[moduleName]) {
      // Check if the value is a boolean or an object with access property
      if (typeof moduleAccess[moduleName] === 'boolean') {
        return moduleAccess[moduleName] as boolean;
      } else if (typeof moduleAccess[moduleName] === 'object') {
        return moduleAccess[moduleName].access === true;
      }
    }
    
    // Try to find a case-insensitive match
    const matchingKey = Object.keys(moduleAccess).find(key => 
      key.toLowerCase() === moduleName.toLowerCase()
    );
    
    if (matchingKey) {
      // Check if the value is a boolean or an object with access property
      if (typeof moduleAccess[matchingKey] === 'boolean') {
        return moduleAccess[matchingKey] as boolean;
      } else if (typeof moduleAccess[matchingKey] === 'object') {
        return moduleAccess[matchingKey].access === true;
      }
    }
    
    return false;
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  const handleLogout = async () => {
    try {
      setAlertType('info');
      setAlertMessage(t('common.loggingOut'));
      setAlertVisible(true);
      
      // Add a small delay to show the alert before logging out
      setTimeout(async () => {
        // Save the baseUrl before clearing auth data
        const baseUrl = await getBaseUrl();
        
        // Clear auth data
        await clearAuthData();
        
        // If baseUrl exists, restore it after clearing auth data
        if (baseUrl) {
          await AsyncStorage.setItem('baseUrl', baseUrl);
        }
        
        router.replace('/auth/Login');
      }, 1000);
    } catch (error) {
      console.error('Logout error:', error);
      setAlertType('error');
      setAlertMessage(t('common.logoutError'));
      setAlertVisible(true);
    }
  };

  const navigateTo = (route: string) => {
    router.push(route as any);
  };

  // Add this function to specifically navigate to user profile
  const navigateToUserProfile = () => {
    router.push('/modules/user/userProfile');
  };

  const renderDashboardTab = () => {
    // Define menu items with their corresponding module access keys
    const menuItems = [
      { 
        id: 'payslip', 
        title: t('employee.payslip'), 
        icon: 'cash-outline', 
        route: '/modules/payslip/payslipListing',
        color: '#4CAF50',
        description: t('employee.payslipDescription') || 'View your salary details',
        moduleKey: 'payslip'
      },
      { 
        id: 'leave', 
        title: t('employee.leave'), 
        icon: 'calendar-outline', 
        route: '/modules/leave/leaveMenu',
        color: '#2196F3',
        description: t('employee.leaveDescription') || 'Apply for leave and check status',
        moduleKey: 'applyLeave'
      },
      { 
        id: 'noticeboard', 
        title: t('employee.noticeboard'), 
        icon: 'notifications-outline', 
        route: '/modules/noticeboard/nbList',
        color: '#FF9800',
        description: t('employee.noticeboardDescription') || 'View company announcements',
        moduleKey: 'noticeBoard'
      },
      { 
        id: 'attendance', 
        title: t('employee.attendance'), 
        icon: 'time-outline', 
        route: '/modules/attendance/atMenu',
        color: '#9C27B0',
        description: t('employee.attendanceDescription') || 'Check your attendance records',
        moduleKey: 'clockInOut'
      },
      { 
        id: 'overtime', 
        title: t('employee.overtime') || 'Overtime', 
        icon: 'hourglass-outline', 
        route: '/modules/employee/overtime',
        color: '#E91E63',
        description: t('employee.overtimeDescription') || 'Submit and track overtime hours',
        moduleKey: 'overtime'
      }
    ];

    
    // Check access for each menu item and log the result
    menuItems.forEach(item => {
      const hasAccessResult = hasAccess(item.moduleKey);
    });

    // Filter menu items based on module access
    const accessibleMenuItems = menuItems.filter(item => hasAccess(item.moduleKey));

    return (
      <View style={styles.tabContent}>
        <Card 
          style={styles.welcomeCard}
          elevation={3}
          borderRadius={16}
        >
          <Text style={[styles.welcomeText, { color: theme.colors.text.primary }]}>
            {`Welcome, ${employeeName || 'User'}`}
          </Text>
          <Text style={[styles.dateText, { color: theme.colors.text.secondary }]}>
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </Text>
        </Card>

        <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
          {t('employee.quickAccess')}
        </Text>

        <View style={styles.menuGrid}>
          {accessibleMenuItems.length > 0 ? (
            accessibleMenuItems.map((item) => (
              <Card
                key={item.id}
                style={styles.menuCard}
                elevation={2}
                borderRadius={16}
              >
                <TouchableOpacity
                  style={styles.menuItemContent}
                  onPress={() => navigateTo(item.route)}
                >
                  <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
                    <Ionicons name={item.icon as any} size={28} color={item.color} />
                  </View>
                  <View style={styles.menuTextContainer}>
                    <Text style={[styles.menuItemText, { color: theme.colors.text.primary }]}>
                      {item.title}
                    </Text>
                    <Text style={[styles.menuItemDescription, { color: theme.colors.text.secondary }]}>
                      {item.description}
                    </Text>
                  </View>
                </TouchableOpacity>
              </Card>
            ))
          ) : (
            <View style={styles.noAccessContainer}>
              <Ionicons name="lock-closed" size={60} color={theme.colors.text.secondary} />
              <Text style={[styles.noAccessText, { color: theme.colors.text.secondary }]}>
                {t('employee.noModuleAccess', 'You do not have access to any modules')}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderTimesheetTab = () => {
    return (
      <View style={styles.tabContent}>
        <Card 
          style={styles.comingSoonCard}
          elevation={3}
          borderRadius={16}
        >
          <Ionicons name="time" size={60} color={theme.colors.primary} />
          <Text style={[styles.comingSoonText, { color: theme.colors.text.primary }]}>
            {t('employee.timesheetComingSoon')}
          </Text>
          <Text style={[styles.comingSoonSubtext, { color: theme.colors.text.secondary }]}>
            {t('employee.timesheetDescription')}
          </Text>
        </Card>
      </View>
    );
  };

  const renderSettingsTab = () => {
    return (
      <View style={styles.tabContent}>
        <Card 
          style={styles.settingsCard}
          elevation={3}
          borderRadius={16}
        >
          {/*Update the title in the settings tab content*/}
          <View style={styles.settingsHeader}>
            <Ionicons name="settings" size={40} color={theme.colors.primary} />
            <Text style={[styles.settingsTitle, { color: theme.colors.text.primary }]}>
              {t('common.menu', 'Menu')}
            </Text>
          </View>
          
          <TouchableOpacity 
            style={styles.settingsItem}
            onPress={navigateToUserProfile}
          >
            <Ionicons name="person-outline" size={24} color={theme.colors.primary} />
            <Text style={[styles.settingsItemText, { color: theme.colors.text.primary }]}>
              {t('settings.profile')}
            </Text>
            <Ionicons name="chevron-forward" size={24} color={theme.colors.text.secondary} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.settingsItem}
            onPress={() => navigateTo('/modules/settings/SettingScreen')}
          >
            <Ionicons name="options-outline" size={24} color={theme.colors.primary} />
            <Text style={[styles.settingsItemText, { color: theme.colors.text.primary }]}>
              {t('settings.preferences')}
            </Text>
            <Ionicons name="chevron-forward" size={24} color={theme.colors.text.secondary} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.settingsItem, { borderBottomWidth: 0 }]}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={24} color={theme.colors.accent} />
            <Text style={[styles.settingsItemText, { color: theme.colors.accent }]}>
              {t('common.logout')}
            </Text>
            <Ionicons name="chevron-forward" size={24} color={theme.colors.text.secondary} />
          </TouchableOpacity>
        </Card>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background.primary }]}>
        <StatusBar
          barStyle={isDark ? "light-content" : "dark-content"}
          backgroundColor={theme.colors.background.primary}
        />
        <LoadingIndicator size={100} showText={true} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={theme.colors.background.primary}
      />
      
      <Stack.Screen 
        options={{
          headerShown: false,
        }}
      />

      <View style={[styles.header, { backgroundColor: theme.colors.background.primary }]}>
        <View style={styles.logoContainer}>
          <Text style={[styles.companyName, { color: theme.colors.text.secondary }]}>
            {companyName}
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.profileButton}
          onPress={navigateToUserProfile}
        >
          <Ionicons name="person-circle-outline" size={50} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {activeTab === 'dashboard' 
          ? renderDashboardTab() 
          : activeTab === 'timesheet' 
            ? renderTimesheetTab() 
            : renderSettingsTab()}
      </ScrollView>

      {/* Moved tab bar from top to bottom */}
      <View style={[styles.tabBar, { 
        backgroundColor: theme.colors.background.primary,
        borderTopColor: theme.colors.border.light,
        borderTopWidth: 1,
        borderBottomWidth: 0,
        // Add platform-specific padding for iOS
        paddingBottom: Platform.OS === 'ios' ? 25 : 0
      }]}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'dashboard' && [styles.activeTabButton, { borderTopColor: theme.colors.primary, borderBottomColor: 'transparent' }]
          ]}
          onPress={() => handleTabChange('dashboard')}
        >
          <Ionicons 
            name="grid-outline" 
            size={20} 
            color={activeTab === 'dashboard' ? theme.colors.primary : theme.colors.text.secondary} 
            style={styles.tabIcon} // Add this style
          />
          <Text 
            style={[
              styles.tabButtonText, 
              { color: activeTab === 'dashboard' ? theme.colors.primary : theme.colors.text.secondary }
            ]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {t('employee.dashboard')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'timesheet' && [styles.activeTabButton, { borderTopColor: theme.colors.primary, borderBottomColor: 'transparent' }]
          ]}
          onPress={() => handleTabChange('timesheet')}
        >
          <Ionicons 
            name="time-outline" 
            size={20} 
            color={activeTab === 'timesheet' ? theme.colors.primary : theme.colors.text.secondary} 
            style={styles.tabIcon} // Add this style
          />
          <Text 
            style={[
              styles.tabButtonText, 
              { color: activeTab === 'timesheet' ? theme.colors.primary : theme.colors.text.secondary }
            ]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {t('employee.timesheet')}
          </Text>
        </TouchableOpacity>

        {/* Remove the settings header that was incorrectly placed here */}
        
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'settings' && [styles.activeTabButton, { borderTopColor: theme.colors.primary, borderBottomColor: 'transparent' }]
          ]}
          onPress={() => handleTabChange('settings')}
        >
          <Ionicons 
            name="menu-outline" 
            size={20} 
            color={activeTab === 'settings' ? theme.colors.primary : theme.colors.text.secondary} 
          />
          <Text 
            style={[
              styles.tabButtonText, 
              { color: activeTab === 'settings' ? theme.colors.primary : theme.colors.text.secondary }
            ]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {t('common.menu', 'Menu')}
          </Text>
        </TouchableOpacity>
      </View>

      <AlertMessage
        visible={alertVisible}
        type={alertType}
        message={alertMessage}
        onClose={() => setAlertVisible(false)}
        duration={3000}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  companyName: {
    fontSize: 18,
    fontWeight: '600',
    maxWidth: 250, // Limit width to prevent overflow
  },
  profileButton: {
    padding: 10,
    marginRight: -5,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    width: '100%',
    // Changed from top to bottom positioning
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    width: '33.33%',
    justifyContent: 'center',
  },
  activeTabButton: {
    // Changed from borderBottomWidth to borderTopWidth
    borderTopWidth: 3,
    borderBottomWidth: 0,
  },
  tabButtonText: {
    marginLeft: 4,
    fontWeight: '500',
    fontSize: 13,
    maxWidth: '70%',
  },
  scrollView: {
    flex: 1,
  },
  tabContent: {
    padding: 20,
  },
  welcomeCard: {
    padding: 20,
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  dateText: {
    fontSize: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    marginLeft: 4,
  },
  menuGrid: {
    marginBottom: 24,
  },
  menuCard: {
    marginBottom: 16,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuItemText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  menuItemDescription: {
    fontSize: 14,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  settingsButton: {
    flex: 1,
    marginRight: 8,
  },
  comingSoonCard: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  comingSoonText: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  comingSoonSubtext: {
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 24,
    marginBottom: 24,
  },
  goBackButton: {
    marginTop: 16,
    width: '60%',
  },
  
  // New styles for settings tab
  settingsCard: {
    padding: 0,
    overflow: 'hidden',
    marginBottom: 24,
  },
  settingsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  settingsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 15,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  settingsItemText: {
    fontSize: 16,
    marginLeft: 15,
    flex: 1,
  },
  
  // New styles for module access
  noAccessContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    marginTop: 20,
  },
  noAccessText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 24,
  },
  tabIcon: {
    marginTop: 2,
  },
});