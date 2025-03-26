import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import useTheme from '../../themes/useTheme';
import { getUserRoles, getUserToken, getBaseUrl } from '../../utils/authStorage';
import { getEmployeeName, getCompanyName } from '../../utils/employeeStorage';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import components
import Button from '../../components/Button';
import Card from '../../components/Card';
import AlertMessage from '../../components/AlertMessage';
import LoadingIndicator from '../../components/LoadingIndicator';

export default function LeaveMenu() {
  const { t } = useTranslation();
  const { theme, isDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<'success' | 'error' | 'warning' | 'info'>('info');
  const [employeeName, setEmployeeName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [isApprover, setIsApprover] = useState(false);

  // Load employee data and user roles
  useEffect(() => {
    const loadData = async () => {
      try {
        const name = await getEmployeeName();
        const company = await getCompanyName();
        const roles = await getUserRoles();
        
        if (name) setEmployeeName(name);
        if (company) setCompanyName(company);
        if (roles) {
          setUserRoles(roles);
        }
        
        // Check if user has approver role
        // This is a simple check - you might need to adjust based on your actual role names
        const hasApproverRole = roles.some(role => 
          role.toLowerCase().includes('manager') || 
          role.toLowerCase().includes('supervisor') || 
          role.toLowerCase().includes('approver') ||
          role.toLowerCase().includes('admin')
        );
        
        setIsApprover(hasApproverRole);
        
        // Simulate loading for a better UX
        setTimeout(() => {
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error loading employee data:', error);
        setLoading(false);
        showAlert('error', t('common.errorLoadingData', 'Error loading data'));
      }
    };
    
    loadData();
  }, []);

  // Define menu items with their corresponding routes and access levels
  const getMenuItems = () => {
    
    const menuItems = [
      { 
        id: 'apply_leave', 
        title: t('leave.applyLeave', 'Create Leave Application'), 
        icon: 'add-circle-outline', 
        route: '/modules/leave/CreateLeaveApplication',
        color: '#4CAF50',
        description: t('leave.applyLeaveDesc', 'Submit a new leave application'),
        forApprovers: false,
        forEmployees: true
      },
      { 
        id: 'leave_balance', 
        title: t('leave.leaveBalance', 'View Leave Balance'), 
        icon: 'calendar-outline', 
        route: '/modules/leave/LeaveEntitlement',
        color: '#2196F3',
        description: t('leave.leaveBalanceDesc', 'View your available leave balance'),
        forApprovers: false,
        forEmployees: true
      },
      { 
        id: 'leave_history', 
        title: t('leave.leaveHistory', 'View Leave Applications'), 
        icon: 'time-outline', 
        route: '/modules/leave/ViewLeaveApplication',
        color: '#9C27B0',
        description: t('leave.leaveHistoryDesc', 'View your leave application history'),
        forApprovers: false,
        forEmployees: true
      },
      { 
        id: 'approve_leave', 
        title: t('leave.approveLeave', 'Approve Leave Applications'), 
        icon: 'checkmark-circle-outline', 
        route: '/modules/leave/approveLeave',
        color: '#E91E63',
        description: t('leave.approveLeaveDesc', 'Review and approve team leave requests'),
        forApprovers: true,
        forEmployees: false
      }
    ];

    // Filter items based on user role
    // Only show items that are either:
    // 1. For all employees (forEmployees: true) OR
    // 2. For approvers (forApprovers: true) AND the user is an approver
    const filteredItems = menuItems.filter(item => 
      (item.forEmployees) || (item.forApprovers && isApprover)
    );
    
    return filteredItems;
  };

  const showAlert = (type: 'success' | 'error' | 'warning' | 'info', message: string) => {
    setAlertType(type);
    setAlertMessage(message);
    setAlertVisible(true);
  };

  const navigateTo = (route: string) => {
    // Cast the route string to any to bypass TypeScript's strict route type checking
    // This is necessary because we're using dynamic routes that TypeScript can't validate at compile time
    router.push(route as any);
  };

  const handleBackPress = () => {
    router.back();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      <Stack.Screen 
        options={{
          headerShown: false,
        }}
      />
      
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background.primary}
      />
      
      <AlertMessage
        visible={alertVisible}
        type={alertType}
        message={alertMessage}
        onClose={() => setAlertVisible(false)}
      />

      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={handleBackPress}
        >
          <Ionicons 
            name="arrow-back" 
            size={24} 
            color={theme.colors.text.primary} 
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>
          {t('leave.leaveManagement', 'Leave Management')}
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <LoadingIndicator 
            size={60}
            duration={600}
            showText={true}
          />
        </View>
      ) : (
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          <Card 
            style={styles.welcomeCard}
            elevation={3}
            borderRadius={16}
          >
            <Text style={[styles.welcomeText, { color: theme.colors.text.primary }]}>
              {`${t('common.welcome', 'Welcome')}, ${employeeName || t('common.user', 'User')}`}
            </Text>
            <Text style={[styles.companyText, { color: theme.colors.text.secondary }]}>
              {companyName}
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
            {t('leave.leaveOptions', 'Leave Options')}
          </Text>

          <View style={styles.menuGrid}>
            {getMenuItems().map((item) => (
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
            ))}
          </View>

          {/* Removing the large back button at the bottom */}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  welcomeCard: {
    padding: 20,
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  companyText: {
    fontSize: 16,
    marginBottom: 8,
  },
  dateText: {
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  menuGrid: {
    flexDirection: 'column',
    width: '100%',
  },
  menuCard: {
    marginBottom: 12,
  },
  menuItemContent: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  menuItemDescription: {
    fontSize: 14,
  },
  buttonContainer: {
    marginTop: 20,
    marginBottom: 40,
  },
  backButtonLarge: {
    marginTop: 10,
  },
});