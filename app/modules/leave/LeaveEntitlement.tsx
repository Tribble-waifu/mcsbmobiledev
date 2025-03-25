import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  StatusBar,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';

// Import components
import Card from '../../components/Card';
import Button from '../../components/Button';
import AlertMessage from '../../components/AlertMessage';
import LoadingIndicator from '../../components/LoadingIndicator';
import YearPickerModal from '../../components/YearPickerModal';

// Import API and utilities
import { getLeaveEntitlement, LeaveEntitlement as LeaveEntitlementType } from '../../api/leaveApi';
import useTheme from '../../themes/useTheme';

const LeaveEntitlementScreen: React.FC = () => {
  const { t } = useTranslation();
  const { theme, isDark } = useTheme();
  
  // State variables
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [entitlements, setEntitlements] = useState<LeaveEntitlementType[]>([]);
  const [employeeInfo, setEmployeeInfo] = useState<any>(null);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [yearPickerVisible, setYearPickerVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertType, setAlertType] = useState<'success' | 'error' | 'warning' | 'info'>('info');
  const [alertMessage, setAlertMessage] = useState('');

  // Fetch leave entitlements
  const fetchLeaveEntitlements = async (year: number = selectedYear) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await getLeaveEntitlement(year);
      
      if (result) {
        setEntitlements(result.entitlements);
        setEmployeeInfo(result.employee);
      } else {
        setError(t('leave.errorLoadingEntitlements', 'Error loading leave entitlements'));
        showAlert('error', t('leave.errorLoadingEntitlements', 'Error loading leave entitlements'));
      }
    } catch (err) {
      console.error('Error fetching leave entitlements:', err);
      setError(t('leave.errorLoadingEntitlements', 'Error loading leave entitlements'));
      showAlert('error', t('leave.errorLoadingEntitlements', 'Error loading leave entitlements'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Show alert message
  const showAlert = (type: 'success' | 'error' | 'warning' | 'info', message: string) => {
    setAlertType(type);
    setAlertMessage(message);
    setAlertVisible(true);
  };

  // Handle refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchLeaveEntitlements();
  };

  // Handle year selection
  const handleYearChange = (year: number) => {
    setSelectedYear(year);
    fetchLeaveEntitlements(year);
  };

  // Initial data fetch
  useEffect(() => {
    fetchLeaveEntitlements();
  }, []);

  // Render leave entitlement card
  const renderLeaveEntitlementCard = (item: LeaveEntitlementType) => {
    // Calculate percentage for progress bar
    const totalDays = item.earnedDays + item.carryForwardDays;
    const usedDays = item.takenDays;
    const percentage = totalDays > 0 ? Math.min(100, (usedDays / totalDays) * 100) : 0;
    
    return (
      <Card 
        key={item.leaveCodeId}
        style={styles.leaveCard}
        elevation={2}
        borderRadius={12}
      >
        <View style={styles.leaveCardHeader}>
          <View style={styles.leaveTypeContainer}>
            <View 
              style={[
                styles.leaveTypeTag, 
                { backgroundColor: theme.colors.primary + '20' }
              ]}
            >
              <Text style={[styles.leaveTypeText, { color: theme.colors.primary }]}>
                {item.leaveCode}
              </Text>
            </View>
            <Text style={[styles.leaveTypeName, { color: theme.colors.text.primary }]}>
              {item.leaveCodeDesc}
            </Text>
          </View>
        </View>
        
        <View style={styles.leaveCardContent}>
          <View style={styles.balanceRow}>
            <View style={styles.balanceItem}>
              <Text style={[styles.balanceLabel, { color: theme.colors.text.secondary }]}>
                {t('leave.earned', 'Earned')}
              </Text>
              <Text style={[styles.balanceValue, { color: theme.colors.text.primary }]}>
                {item.earnedDays.toFixed(1)}
              </Text>
            </View>
            
            <View style={styles.balanceItem}>
              <Text style={[styles.balanceLabel, { color: theme.colors.text.secondary }]}>
                {t('leave.carryForward', 'Carry Forward')}
              </Text>
              <Text style={[styles.balanceValue, { color: theme.colors.text.primary }]}>
                {item.carryForwardDays.toFixed(1)}
              </Text>
            </View>
            
            <View style={styles.balanceItem}>
              <Text style={[styles.balanceLabel, { color: theme.colors.text.secondary }]}>
                {t('leave.taken', 'Taken')}
              </Text>
              <Text style={[styles.balanceValue, { color: theme.colors.status.error }]}>
                {item.takenDays.toFixed(1)}
              </Text>
            </View>
            
            <View style={styles.balanceItem}>
              <Text style={[styles.balanceLabel, { color: theme.colors.text.secondary }]}>
                {t('leave.adjustment', 'Adjustment')}
              </Text>
              <Text style={[styles.balanceValue, { color: theme.colors.text.primary }]}>
                {item.adjustmentDays.toFixed(1)}
              </Text>
            </View>
          </View>
          
          <View style={styles.balanceProgressContainer}>
            <View style={styles.balanceTotalContainer}>
              <Text style={[styles.balanceTotalLabel, { color: theme.colors.text.secondary }]}>
                {t('leave.balance', 'Balance')}
              </Text>
              <Text style={[styles.balanceTotalValue, { color: theme.colors.primary }]}>
                {item.balanceDays.toFixed(1)}
              </Text>
            </View>
            
            <View style={[styles.progressBarContainer, { backgroundColor: theme.colors.border.light }]}>
              <View 
                style={[
                  styles.progressBar, 
                  { 
                    width: `${percentage}%`, 
                    backgroundColor: percentage > 80 
                      ? theme.colors.status.error 
                      : percentage > 50 
                        ? theme.colors.status.warning 
                        : theme.colors.status.success 
                  }
                ]} 
              />
            </View>
          </View>
          
          <View style={styles.validityContainer}>
            <Text style={[styles.validityText, { color: theme.colors.text.secondary }]}>
              {t('leave.validPeriod', 'Valid Period')}: {format(new Date(item.effectiveFrom), 'dd/MM/yyyy')} - {format(new Date(item.effectiveTo), 'dd/MM/yyyy')}
            </Text>
          </View>
        </View>
      </Card>
    );
  };

  // Render employee info card
  const renderEmployeeInfoCard = () => {
    if (!employeeInfo) return null;
    
    return (
      <Card 
        style={styles.employeeCard}
        elevation={2}
        borderRadius={12}
      >
        <View style={styles.employeeCardContent}>
          <View style={styles.employeeInfoRow}>
            <Text style={[styles.employeeInfoLabel, { color: theme.colors.text.secondary }]}>
              {t('employee.id', 'Employee ID')}:
            </Text>
            <Text style={[styles.employeeInfoValue, { color: theme.colors.text.primary }]}>
              {employeeInfo.employeeNumber}
            </Text>
          </View>
          
          <View style={styles.employeeInfoRow}>
            <Text style={[styles.employeeInfoLabel, { color: theme.colors.text.secondary }]}>
              {t('employee.name', 'Name')}:
            </Text>
            <Text style={[styles.employeeInfoValue, { color: theme.colors.text.primary }]}>
              {employeeInfo.name}
            </Text>
          </View>
          
          <View style={styles.employeeInfoRow}>
            <Text style={[styles.employeeInfoLabel, { color: theme.colors.text.secondary }]}>
              {t('employee.department', 'Department')}:
            </Text>
            <Text style={[styles.employeeInfoValue, { color: theme.colors.text.primary }]}>
              {employeeInfo.departmentDesc}
            </Text>
          </View>
          
          <View style={styles.employeeInfoRow}>
            <Text style={[styles.employeeInfoLabel, { color: theme.colors.text.secondary }]}>
              {t('employee.jobTitle', 'Job Title')}:
            </Text>
            <Text style={[styles.employeeInfoValue, { color: theme.colors.text.primary }]}>
              {employeeInfo.jobTitleDesc}
            </Text>
          </View>
          
          <View style={styles.employeeInfoRow}>
            <Text style={[styles.employeeInfoLabel, { color: theme.colors.text.secondary }]}>
              {t('employee.joinDate', 'Join Date')}:
            </Text>
            <Text style={[styles.employeeInfoValue, { color: theme.colors.text.primary }]}>
              {format(new Date(employeeInfo.dateJoin), 'dd/MM/yyyy')}
            </Text>
          </View>
        </View>
      </Card>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={theme.colors.background.primary}
      />
      
      {/* Replace the Stack.Screen with a custom header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={[styles.backButton, { backgroundColor: 'rgba(0,0,0,0.05)' }]} 
          onPress={() => router.back()}
        >
          <Ionicons 
            name="arrow-back" 
            size={24} 
            color={theme.colors.text.primary} 
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>
          {t('leave.entitlements', 'Leave Entitlements')}
        </Text>
      </View>
      
      <View style={styles.yearSelectorContainer}>
        <TouchableOpacity
          style={[styles.yearNavigationButton, { backgroundColor: theme.colors.background.secondary }]}
          onPress={() => handleYearChange(selectedYear - 1)}
        >
          <Ionicons name="chevron-back" size={24} color={theme.colors.text.secondary} />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.yearButton, { 
            backgroundColor: theme.colors.background.secondary,
            borderColor: theme.colors.border.light
          }]}
          onPress={() => setYearPickerVisible(true)}
        >
          <Text style={[styles.yearButtonText, { color: theme.colors.text.primary }]}>
            {selectedYear}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.yearNavigationButton, { backgroundColor: theme.colors.background.secondary }]}
          onPress={() => handleYearChange(selectedYear + 1)}
        >
          <Ionicons name="chevron-forward" size={24} color={theme.colors.text.secondary} />
        </TouchableOpacity>
      </View>
      
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <LoadingIndicator size={80} showText={true} />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={60} color={theme.colors.status.error} />
          <Text style={[styles.errorText, { color: theme.colors.text.primary }]}>
            {error}
          </Text>
          <Button
            title={t('common.retry', 'Retry')}
            onPress={() => fetchLeaveEntitlements()}
            variant="primary"
            icon="refresh"
            style={styles.retryButton}
          />
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
        >
          {renderEmployeeInfoCard()}
          
          <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
            {t('leave.leaveBalances', 'Leave Balances')}
          </Text>
          
          {entitlements.length > 0 ? (
            entitlements.map(renderLeaveEntitlementCard)
          ) : (
            <View style={styles.noDataContainer}>
              <Ionicons name="calendar-outline" size={60} color={theme.colors.text.secondary} />
              <Text style={[styles.noDataText, { color: theme.colors.text.primary }]}>
                {t('leave.noEntitlements', 'No leave entitlements found')}
              </Text>
            </View>
          )}
        </ScrollView>
      )}
      
      <YearPickerModal
        visible={yearPickerVisible}
        onClose={() => setYearPickerVisible(false)}
        onSelectYear={handleYearChange}
        selectedYear={selectedYear}
        minYear={2000}
        maxYear={new Date().getFullYear() + 1}
      />
      
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
  // Add these new styles for the header
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    minWidth: 120,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  yearSelectorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  yearNavigationButton: {
    padding: 10,
    borderRadius: 20,
  },
  yearButton: {
    marginHorizontal: 16,
    minWidth: 120,
    borderRadius: 20,
    paddingHorizontal: 30,
    paddingVertical: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  yearButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 12,
  },
  employeeCard: {
    marginTop: 8,
    marginBottom: 16,
  },
  employeeCardContent: {
    padding: 8,
  },
  employeeInfoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  employeeInfoLabel: {
    fontSize: 14,
    width: 100,
  },
  employeeInfoValue: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  leaveCard: {
    marginBottom: 12,
  },
  leaveCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  leaveTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  leaveTypeTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  leaveTypeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  leaveTypeName: {
    fontSize: 16,
    fontWeight: '600',
  },
  leaveCardContent: {
    marginTop: 8,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  balanceItem: {
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  balanceValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  balanceProgressContainer: {
    marginBottom: 12,
  },
  balanceTotalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  balanceTotalLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  balanceTotalValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  progressBarContainer: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
  },
  validityContainer: {
    marginTop: 8,
  },
  validityText: {
    fontSize: 12,
  },
  noDataContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  noDataText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
  }
});

export default LeaveEntitlementScreen;