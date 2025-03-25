import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  FlatList,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal
} from 'react-native';
import DateCalendar from '../../components/DateCalendar';
import { useTranslation } from 'react-i18next';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// Components
import Card from '../../components/Card';
import Button from '../../components/Button';
import LoadingIndicator from '../../components/LoadingIndicator';
import AlertMessage from '../../components/AlertMessage';

// API and Utilities
import { 
  getLeaveCodeSetting, 
  getLeaveEntitlement,
  LeaveCodeSetting, 
  LeaveEntitlement
} from '../../api/leaveApi';
import { getEmployeeId } from '../../utils/employeeStorage';
import { getUserToken } from '../../utils/authStorage';
import useTheme from '../../themes/useTheme';

// Define DateSession interface
interface DateSession {
  date: Date;
  sessionId: number; // 2103: Full Day, 2104: First Half, 2105: Second Half
  included: boolean;
}

const CreateLeaveApplication: React.FC = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { theme, isDark } = useTheme();
  
  // State for leave code selection
  const [showLeaveCodeSelector, setShowLeaveCodeSelector] = useState<boolean>(false);
  const [availableLeaveTypes, setAvailableLeaveTypes] = useState<LeaveEntitlement[]>([]);
  const [selectedLeaveCode, setSelectedLeaveCode] = useState<{id: number, name: string} | null>(null);
  
  // State for leave data
  const [leaveSettings, setLeaveSettings] = useState<LeaveCodeSetting | null>(null);
  const [leaveEntitlements, setLeaveEntitlements] = useState<LeaveEntitlement[]>([]);
  
  // State for date selection
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [datePickerMode, setDatePickerMode] = useState<'start' | 'end'>('start');
  
  
  // Add state for sessions
  const [dateSessions, setDateSessions] = useState<DateSession[]>([]);
  const [totalDays, setTotalDays] = useState<number>(0);
  
  // State for alerts and loading
  const [loading, setLoading] = useState<boolean>(true);
  const [alertVisible, setAlertVisible] = useState<boolean>(false);
  const [alertMessage, setAlertMessage] = useState<string>('');
  const [alertType, setAlertType] = useState<'success' | 'error' | 'warning' | 'info'>('info');

  // Load leave entitlements when component mounts
  useEffect(() => {
    const loadLeaveEntitlements = async () => {
      try {
        setLoading(true);
        
        // Get employee ID from storage
        const employeeId = await getEmployeeId();
        if (!employeeId) {
          showAlert('error', t('leave.employeeIdNotFound', 'Employee ID not found'));
          setLoading(false);
          return;
        }
        
        // Get user token
        const token = await getUserToken();
        if (!token) {
          showAlert('error', t('leave.authError', 'Authentication error'));
          setLoading(false);
          return;
        }
        
        // Get leave entitlements for the current year
        const currentYear = new Date().getFullYear();
        const entitlementResponse = await getLeaveEntitlement(currentYear);
        
        if (entitlementResponse && entitlementResponse.entitlements) {
          setLeaveEntitlements(entitlementResponse.entitlements);
          setAvailableLeaveTypes(entitlementResponse.entitlements);
          setLoading(false);
        } else {
          setLoading(false);
          showAlert('error', t('leave.errorLoadingEntitlements', 'Error loading leave entitlements'));
        }
      } catch (error) {
        console.error('Error loading leave entitlements:', error);
        setLoading(false);
        showAlert('error', t('leave.errorLoadingEntitlements', 'Error loading leave entitlements'));
      }
    };
    
    loadLeaveEntitlements();
  }, []);

  // Initialize date sessions when component mounts
  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setStartDate(today);
    setEndDate(today);
    generateDateSessions(today, today);
  }, []);

  // Handle leave code selection
  const handleLeaveCodeSelect = (leaveCode: LeaveEntitlement) => {
    setSelectedLeaveCode({
      id: leaveCode.leaveCodeId,
      name: leaveCode.leaveCodeDesc
    });
    setShowLeaveCodeSelector(false);
    loadLeaveSettings(leaveCode.leaveCodeId);
  };

  // Load leave settings for a specific leave code
  const loadLeaveSettings = async (codeId: number) => {
    try {
      setLoading(true);
      const settings = await getLeaveCodeSetting(codeId);
      if (settings) {
        setLeaveSettings(settings);
      } else {
        showAlert('error', t('leave.settingsNotFound', 'Leave settings not found'));
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading leave settings:', error);
      setLoading(false);
      showAlert('error', t('leave.errorLoadingSettings', 'Error loading leave settings'));
    }
  };

  const generateDateSessions = (start: Date, end: Date) => {
    const sessions: DateSession[] = [];
    const currentDate = new Date(start);
    currentDate.setHours(0, 0, 0, 0);
    
    const endDateCopy = new Date(end);
    endDateCopy.setHours(0, 0, 0, 0);
    
    while (currentDate <= endDateCopy) {
      sessions.push({
        date: new Date(currentDate),
        sessionId: 2103, // Default to Full Day
        included: true
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    setDateSessions(sessions);
    calculateTotalDays(sessions);
  };

  // Calculate total days based on session selections
  const calculateTotalDays = (sessions: DateSession[]) => {
    let total = 0;
    
    sessions.forEach(session => {
      if (session.included) {
        if (session.sessionId === 2103) { // Full Day
          total += 1;
        } else { // Half Day (First or Second)
          total += 0.5;
        }
      }
    });
    
    setTotalDays(total);
  };

  // Handle session type change
  const handleSessionChange = (index: number, sessionId: number) => {
    const updatedSessions = [...dateSessions];
    updatedSessions[index].sessionId = sessionId;
    setDateSessions(updatedSessions);
    calculateTotalDays(updatedSessions);
  };

  // Handle inclusion/exclusion of dates
  const handleInclusionChange = (index: number, included: boolean) => {
    const updatedSessions = [...dateSessions];
    updatedSessions[index].included = included;
    setDateSessions(updatedSessions);
    calculateTotalDays(updatedSessions);
  };

  // Show alert message
  const showAlert = (type: 'success' | 'error' | 'warning' | 'info', message: string) => {
    setAlertType(type);
    setAlertMessage(message);
    setAlertVisible(true);
  };

  // Render loading indicator
  if (loading && !showLeaveCodeSelector) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
        <LoadingIndicator showText={true} />
      </View>
    );
  }

  // Render leave code selector
  if (showLeaveCodeSelector) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <Ionicons 
              name="arrow-back" 
              size={24} 
              color={theme.colors.text.primary} 
            />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>
            {t('leave.selectLeaveType', 'Select Leave Type')}
          </Text>
        </View>
        
        {loading ? (
          <LoadingIndicator showText={true} />
        ) : (
          <FlatList
            data={availableLeaveTypes}
            keyExtractor={(item) => item.leaveCodeId.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => handleLeaveCodeSelect(item)}
                style={[
                  styles.leaveTypeItem,
                  { backgroundColor: theme.colors.card.background }
                ]}
              >
                <View>
                  <Text style={[styles.leaveTypeTitle, { color: theme.colors.text.primary }]}>
                    {item.leaveCodeDesc}
                  </Text>
                  <Text style={[styles.leaveTypeBalance, { color: theme.colors.text.secondary }]}>
                    {t('leave.balance', 'Balance')}: {item.balanceDays} {t('leave.days', 'days')}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color={theme.colors.text.secondary} />
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.leaveTypeList}
            ListEmptyComponent={
              <Text style={[styles.emptyMessage, { color: theme.colors.text.secondary }]}>
                {t('leave.noLeaveTypes', 'No leave types available')}
              </Text>
            }
          />
        )}
        
        {/* Alert Message */}
        <AlertMessage
          visible={alertVisible}
          type={alertType}
          message={alertMessage}
          onClose={() => setAlertVisible(false)}
        />
      </View>
    );
  }

  // Handle date selection
  const handleDateSelect = (date: Date, type: 'start' | 'end') => {
    if (type === 'start') {
      const newStartDate = new Date(date);
      newStartDate.setHours(0, 0, 0, 0);
      setStartDate(newStartDate);
      
      // If end date is before start date, update end date
      if (endDate < newStartDate) {
        setEndDate(newStartDate);
        generateDateSessions(newStartDate, newStartDate);
      } else {
        generateDateSessions(newStartDate, endDate);
      }
    } else {
      // Check if selected end date is before start date
      if (date < startDate) {
        showAlert('error', t('leave.endDateBeforeStart', 'End date cannot be earlier than start date'));
        return;
      }
      
      const newEndDate = new Date(date);
      newEndDate.setHours(0, 0, 0, 0);
      setEndDate(newEndDate);
      generateDateSessions(startDate, newEndDate);
    }
    
    // Close date picker after selection
    setShowDatePicker(false);
  };

  // Main form view (simplified for this example)
  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView 
        style={[styles.container, { backgroundColor: theme.colors.background.primary }]}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <Ionicons 
              name="arrow-back" 
              size={24} 
              color={theme.colors.text.primary} 
            />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>
            {t('leave.applyLeave', 'Apply for Leave')}
          </Text>
        </View>
        
        <Card style={styles.card}>
          {/* Leave Type Dropdown */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: theme.colors.text.primary }]}>
              {t('leave.leaveType', 'Leave Type')}
            </Text>
            <TouchableOpacity 
              style={[styles.dropdownButton, { borderColor: theme.colors.border.medium }]}
              onPress={() => setShowLeaveCodeSelector(true)}
            >
              <Text style={[
                styles.dropdownButtonText, 
                { 
                  color: selectedLeaveCode 
                    ? theme.colors.text.primary 
                    : theme.colors.text.secondary 
                }
              ]}>
                {selectedLeaveCode?.name || t('leave.selectLeaveType', 'Select Leave Type')}
              </Text>
              <Ionicons name="chevron-down" size={20} color={theme.colors.text.secondary} />
            </TouchableOpacity>
          </View>
          
          {/* Leave Note Display */}
          {leaveSettings?.note && (
            <View style={[
              styles.noteContainer, 
              { backgroundColor: isDark ? '#3A3000' : '#FFF9E6', 
                borderLeftWidth: 4,
                borderLeftColor: theme.colors.accent || '#FFC107' }
            ]}>
              <View style={styles.noteHeader}>
                <Ionicons name="information-circle" size={20} color={theme.colors.accent || '#FFC107'} />
                <Text style={[styles.noteTitle, { color: theme.colors.text.primary }]}>
                  {t('leave.note', 'Note')}
                </Text>
              </View>
              <Text style={[styles.noteText, { color: theme.colors.text.primary }]}>
                {leaveSettings.note}
              </Text>
            </View>
          )}
          
          {/* Date Range Selection */}
          <View style={styles.formGroup}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
              {t('leave.dateRange', 'Date Range')}
            </Text>
            
            <View style={styles.dateRow}>
              <View style={styles.dateField}>
                <Text style={[styles.dateLabel, { color: theme.colors.text.secondary }]}>
                  {t('leave.fromDate', 'From')}
                </Text>
                <TouchableOpacity 
                  style={[styles.dateButton, { borderColor: theme.colors.border.medium }]}
                  onPress={() => {
                    setDatePickerMode('start');
                    setShowDatePicker(true);
                  }}
                >
                  <Text style={{ color: theme.colors.text.primary }}>
                    {startDate.toLocaleDateString()}
                  </Text>
                  <Ionicons name="calendar-outline" size={20} color={theme.colors.primary} />
                </TouchableOpacity>
              </View>
              
              <View style={[styles.dateField, { marginLeft: 8 }]}>
                <Text style={[styles.dateLabel, { color: theme.colors.text.secondary }]}>
                  {t('leave.toDate', 'To')}
                </Text>
                <TouchableOpacity 
                  style={[styles.dateButton, { borderColor: theme.colors.border.medium }]}
                  onPress={() => {
                    setDatePickerMode('end');
                    setShowDatePicker(true);
                  }}
                >
                  <Text style={{ color: theme.colors.text.primary }}>
                    {endDate.toLocaleDateString()}
                  </Text>
                  <Ionicons name="calendar-outline" size={20} color={theme.colors.primary} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
          
          // Replace the session selection UI (around line 447-498)
          {/* Session Selection */}
          <View style={styles.formGroup}>
            <View style={styles.sessionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
                {t('leave.sessions', 'Sessions')}
              </Text>
              <Text style={[styles.totalDays, { color: theme.colors.text.primary }]}>
                {t('leave.totalDays', 'Total')}: {totalDays} {t('leave.days', 'days')}
              </Text>
            </View>
            
            <View style={styles.sessionList}>
              {dateSessions.map((session, index) => (
                <View key={index} style={[
                  styles.sessionItem, 
                  { borderColor: theme.colors.border.light }
                ]}>
                  <TouchableOpacity 
                    style={styles.sessionCheckbox}
                    onPress={() => handleInclusionChange(index, !session.included)}
                  >
                    <Ionicons 
                      name={session.included ? "checkbox" : "square-outline"} 
                      size={24} 
                      color={theme.colors.primary} 
                    />
                  </TouchableOpacity>
                  
                  <Text style={[styles.sessionDate, { 
                    color: session.included ? theme.colors.text.primary : theme.colors.text.secondary,
                    textDecorationLine: session.included ? 'none' : 'line-through'
                  }]}>
                    {session.date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                  </Text>
                  
                  <View style={styles.sessionTypeContainer}>
                    <TouchableOpacity 
                      style={[
                        styles.sessionTypeButton, 
                        session.sessionId === 2103 && styles.sessionTypeSelected,
                        { borderColor: theme.colors.border.medium }
                      ]}
                      onPress={() => handleSessionChange(index, 2103)}
                      disabled={!session.included}
                    >
                      <Text style={[
                        styles.sessionTypeText, 
                        { color: session.included ? 
                          (session.sessionId === 2103 ? theme.colors.primary : theme.colors.text.primary) : 
                          theme.colors.text.secondary 
                        }
                      ]}>
                        {t('leave.fullDay', 'Full')}
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[
                        styles.sessionTypeButton, 
                        session.sessionId === 2104 && styles.sessionTypeSelected,
                        { borderColor: theme.colors.border.medium }
                      ]}
                      onPress={() => handleSessionChange(index, 2104)}
                      disabled={!session.included}
                    >
                      <Text style={[
                        styles.sessionTypeText, 
                        { color: session.included ? 
                          (session.sessionId === 2104 ? theme.colors.primary : theme.colors.text.primary) : 
                          theme.colors.text.secondary 
                        }
                      ]}>
                        {t('leave.firstHalf', '1st')}
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[
                        styles.sessionTypeButton, 
                        session.sessionId === 2105 && styles.sessionTypeSelected,
                        { borderColor: theme.colors.border.medium }
                      ]}
                      onPress={() => handleSessionChange(index, 2105)}
                      disabled={!session.included}
                    >
                      <Text style={[
                        styles.sessionTypeText, 
                        { color: session.included ? 
                          (session.sessionId === 2105 ? theme.colors.primary : theme.colors.text.primary) : 
                          theme.colors.text.secondary 
                        }
                      ]}>
                        {t('leave.secondHalf', '2nd')}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </View>
          
          {/* Submit Button */}
          <Button
            title={t('leave.submit', 'Submit Application')}
            onPress={() => {
              // Handle submit logic here
              showAlert('info', t('leave.submitting', 'Submitting application...'));
            }}
            style={styles.submitButton}
          />
        </Card>
      </ScrollView>
      
      {/* Leave Type Selector Modal */}
      <Modal
        visible={showLeaveCodeSelector}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowLeaveCodeSelector(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.background.primary }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text.primary }]}>
                {t('leave.selectLeaveType', 'Select Leave Type')}
              </Text>
              <TouchableOpacity onPress={() => setShowLeaveCodeSelector(false)}>
                <Ionicons name="close" size={24} color={theme.colors.text.primary} />
              </TouchableOpacity>
            </View>
            
            {loading ? (
              <LoadingIndicator showText={true} />
            ) : (
              <FlatList
                data={availableLeaveTypes}
                keyExtractor={(item) => item.leaveCodeId.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => {
                      handleLeaveCodeSelect(item);
                      setShowLeaveCodeSelector(false);
                    }}
                    style={[
                      styles.leaveTypeItem,
                      { backgroundColor: theme.colors.card.background }
                    ]}
                  >
                    <View>
                      <Text style={[styles.leaveTypeTitle, { color: theme.colors.text.primary }]}>
                        {item.leaveCodeDesc}
                      </Text>
                      <Text style={[styles.leaveTypeBalance, { color: theme.colors.text.secondary }]}>
                        {t('leave.balance', 'Balance')}: {item.balanceDays} {t('leave.days', 'days')}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={24} color={theme.colors.text.secondary} />
                  </TouchableOpacity>
                )}
                contentContainerStyle={styles.leaveTypeList}
                ListEmptyComponent={
                  <Text style={[styles.emptyMessage, { color: theme.colors.text.secondary }]}>
                    {t('leave.noLeaveTypes', 'No leave types available')}
                  </Text>
                }
              />
            )}
          </View>
        </View>
      </Modal>
      
      {/* Date Picker Modal */}
            <Modal
              visible={showDatePicker}
              transparent={true}
              animationType="fade"
              onRequestClose={() => setShowDatePicker(false)}
            >
              <View style={styles.modalContainer}>
                <View style={[styles.modalContent, { backgroundColor: theme.colors.background.primary }]}>
                  <View style={styles.modalHeader}>
                    <Text style={[styles.modalTitle, { color: theme.colors.text.primary }]}>
                      {datePickerMode === 'start' 
                        ? t('leave.selectStartDate', 'Select Start Date') 
                        : t('leave.selectEndDate', 'Select End Date')}
                    </Text>
                    <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                      <Ionicons name="close" size={24} color={theme.colors.text.primary} />
                    </TouchableOpacity>
                  </View>
                  
                  <DateCalendar
                    selectedDate={datePickerMode === 'start' ? startDate : endDate}
                    onDateChange={(date) => {
                      handleDateSelect(date, datePickerMode);
                      // Modal will be closed in handleDateSelect if validation passes
                    }}
                    minDate={undefined} // Remove the minDate restriction
                    onClose={() => setShowDatePicker(false)}
                  />
                </View>
              </View>
            </Modal>
      
      {/* Alert Message */}
      <AlertMessage
        visible={alertVisible}
        type={alertType}
        message={alertMessage}
        onClose={() => setAlertVisible(false)}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingTop: 8,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  card: {
    padding: 16,
  },
  leaveTypeList: {
    padding: 16,
  },
  leaveTypeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  leaveTypeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  leaveTypeBalance: {
    fontSize: 14,
  },
  emptyMessage: {
    textAlign: 'center',
    padding: 20,
    fontSize: 16,
  },
  selectedLeaveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  label: {
    fontSize: 14,
    marginRight: 8,
  },
  selectedLeaveText: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  changeButton: {
    padding: 8,
  },
  placeholderContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Form styles
  formGroup: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  // Dropdown styles
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    height: 48,
  },
  dropdownButtonText: {
    fontSize: 16,
  },
  // Date picker styles
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateField: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    height: 48,
  },
  calendarContainer: {
    padding: 16,
  },
  calendar: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  dateInput: {
    borderWidth: 1,
    borderRadius: 8,
    height: 48,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  // Session styles
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  totalDays: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  sessionList: {
    marginBottom: 8,
  },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  sessionCheckbox: {
    marginRight: 12,
  },
  sessionDate: {
    flex: 1,
    fontSize: 16,
  },
  sessionTypeContainer: {
    flexDirection: 'row',
  },
  sessionTypeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderRadius: 4,
    marginLeft: 4,
  },
  sessionTypeSelected: {
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    borderColor: '#2196F3',
  },
  sessionTypeText: {
    fontSize: 14,
  },
  // Button styles
  submitButton: {
    marginTop: 24,
  },
  noteContainer: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  noteTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  noteText: {
    fontSize: 14,
    paddingLeft: 24,
  },
  // Session dropdown styles
  sessionDropdownMenu: {
    position: 'absolute',
    right: 16,
    top: '50%',
    borderRadius: 8,
    padding: 4,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    minWidth: 150,
  },
  sessionDropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
});

export default CreateLeaveApplication;
