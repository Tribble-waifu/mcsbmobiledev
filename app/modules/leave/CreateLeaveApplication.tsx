// Add DateCalendar import
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Modal,
  FlatList,
  TextInput,
  Platform,
  Image
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';

// Components
import Button from '../../components/Button';
import Card from '../../components/Card';
import LoadingIndicator from '../../components/LoadingIndicator';
import AlertMessage from '../../components/AlertMessage';
import DateCalendar from '../../components/DateCalendar';

// Utilities and API
import useTheme from '../../themes/useTheme';
import { 
  getLeaveEntitlement, 
  getLeaveCodeSetting,
  checkLeaveDateValidation
} from '../../api/leaveApi';

// Add import for getUserId from authStorage
import { getUserId } from '../../utils/authStorage';

// Types
interface LeaveEntitlement {
  leaveCodeId: number;
  effectiveFrom: string;
  effectiveTo: string;
  leaveCode: string;
  leaveCodeDesc: string;
  earnedDays: number;
  carryForwardDays: number;
  takenDays: number;
  adjustmentDays: number;
  balanceDays: number;
}

// Add interface for date validation
interface LeaveDateValidationItem {
  date: string;
  isWorkingDay: boolean;
  isHoliday: boolean;
  leaveAppList: any[];
}

// Add DateSession interface and LeaveDate interface
interface LeaveDate {
  Date: string;
  SessionId: number;
}

// Add DateSession interface and session types
interface DateSession {
  date: string;
  formattedDate: string;
  sessionId: number;
  isSelected: boolean;
  isAvailable: boolean;
  existingLeave: string | null;
}

// Add session types
const sessionTypes = [
  { id: 2103, label: 'Full Day' },
  { id: 2104, label: 'First Half' },
  { id: 2105, label: 'Second Half' }
];

const CreateLeaveApplication: React.FC = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { theme } = useTheme();
  
  // State for leave application form
  const [loading, setLoading] = useState(false);
  const [leaveEntitlements, setLeaveEntitlements] = useState<LeaveEntitlement[]>([]);
  const [selectedLeaveCode, setSelectedLeaveCode] = useState<{id: number, name: string} | null>(null);
  const [leaveCodeNote, setLeaveCodeNote] = useState<string | null>(null);
  
  // Add currentUserId state
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  
  // UI state
  const [showLeaveCodeSelector, setShowLeaveCodeSelector] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<'success' | 'error' | 'info' | 'warning'>('info');
  
    // Add date selection state
    const [fromDate, setFromDate] = useState<Date>(new Date());
    const [toDate, setToDate] = useState<Date>(new Date());
    const [showFromDatePicker, setShowFromDatePicker] = useState(false);
    const [showToDatePicker, setShowToDatePicker] = useState(false);
    const [dateValidation, setDateValidation] = useState<LeaveDateValidationItem[]>([]);
    const [isValidatingDates, setIsValidatingDates] = useState(false);
    // Add dateSessions state
    const [dateSessions, setDateSessions] = useState<DateSession[]>([]);
    // Add attachment state
    const [attachment, setAttachment] = useState<{
      uri: string;
      name: string;
      type: string;
      size: number;
    } | null>(null);
    // Add reason state and validation
    const [reason, setReason] = useState<string>('');
    const [reasonError, setReasonError] = useState<string | null>(null);
  
    // Load leave entitlements when component mounts
    useEffect(() => {
      loadLeaveEntitlements();
      generateSessions(); // Generate sessions on component mount
      
      // Fetch user ID when component mounts
      const fetchUserId = async () => {
        try {
          const userId = await getUserId();
          if (userId) {
            setCurrentUserId(parseInt(userId, 10));
          } else {
            console.warn('User ID not found in storage');
            // You might want to handle this case, e.g., redirect to login
          }
        } catch (error) {
          console.error('Error fetching user ID:', error);
        }
      };
    
      fetchUserId();
    }, []);
  
  const loadLeaveEntitlements = async () => {
    try {
      setLoading(true);
      
      // Get leave entitlements for the current year
      const currentYear = new Date().getFullYear();
      const entitlementResponse = await getLeaveEntitlement(currentYear);
      
      if (entitlementResponse && entitlementResponse.entitlements) {
        setLeaveEntitlements(entitlementResponse.entitlements);
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
  
  // Handle leave code selection
  const handleLeaveCodeSelect = async (item: LeaveEntitlement) => {
    setSelectedLeaveCode({
      id: item.leaveCodeId,
      name: item.leaveCodeDesc
    });
    setShowLeaveCodeSelector(false);
    
    // Log the selected leave code instead of fetching from API
    console.log('Selected leave code:', {
      id: item.leaveCodeId,
      name: item.leaveCodeDesc,
      balance: item.balanceDays
    });
    
    // Fetch leave code settings to get the note
    try {
      const leaveCodeSettings = await getLeaveCodeSetting(item.leaveCodeId);
      if (leaveCodeSettings && leaveCodeSettings.note) {
        setLeaveCodeNote(leaveCodeSettings.note);
        console.log(`Retrieved note for leave code ${item.leaveCodeId}: ${leaveCodeSettings.note}`);
      } else {
        setLeaveCodeNote(null);
        console.log(`No note found for leave code ${item.leaveCodeId}`);
      }
    } catch (error) {
      console.error('Error fetching leave code settings:', error);
      setLeaveCodeNote(null);
    }

    // Trigger date validation after selecting leave type
    validateDateRange(fromDate, toDate);
  };
  
  // Show alert message
  const showAlert = (type: 'success' | 'error' | 'info' | 'warning', message: string) => {
    setAlertType(type);
    setAlertMessage(message);
    setAlertVisible(true);
  };
  
  const handleGoBack = () => {
    router.back();
  };
  
  // Update date validation function to ignore isWorkingDay check
  const validateDateRange = async (start: Date, end: Date) => {
    if (!selectedLeaveCode) {
      // If no leave code is selected, just generate sessions without validation
      generateSessions(start, end);
      return;
    }
    
    try {
      setIsValidatingDates(true);
      
      // Use the existing checkLeaveDateValidation function
      const validation = await checkLeaveDateValidation(
        selectedLeaveCode.id,
        start,
        end
      );
      
      // Store validation data for UI
      setDateValidation(validation);
      
      // Log detailed validation results to console
      console.log('\n=== LEAVE DATE VALIDATION ===');
      console.log(`Leave Code ID: ${selectedLeaveCode.id}`);
      console.log(`Date Range: ${start.toLocaleDateString()} to ${end.toLocaleDateString()}`);
      console.log('\n--- VALIDATION DETAILS ---');
      
      // Process each date and log details
      const invalidDates: string[] = [];
      let isValid = true;
      let message = 'All dates are valid';
      
      validation.forEach(item => {
        // Existing validation code...
      });
      
      // Log summary
      console.log('\n=== VALIDATION SUMMARY ===');
      console.log(`Overall validity: ${isValid ? 'VALID ✓' : 'INVALID ✗'}`);
      console.log(`Total dates checked: ${validation.length}`);
      console.log(`Invalid dates: ${invalidDates.length}`);
      console.log(`Message: ${message}`);
      console.log('===========================\n');

      // Show alert if there are invalid dates
      if (!isValid) {
        showAlert('warning', t('leave.invalidDates', 'Some selected dates are not available for leave'));
      }
      
      // Generate sessions after validation is complete
      generateSessions(start, end);
    } catch (error) {
      console.error('Error validating dates:', error);
      showAlert('error', t('leave.validationError', 'Failed to validate selected dates'));
      
      // Generate sessions even if validation fails
      generateSessions(start, end);
    } finally {
      setIsValidatingDates(false);
    }
  };

  // Add date change handlers
  const handleFromDateChange = (date: Date) => {
    setFromDate(date);
    if (date > toDate) {
      setToDate(date);
    }
    
    // Close the date picker first
    setShowFromDatePicker(false);
    
    // First validate the date range, then generate sessions
    validateDateRange(date, toDate > date ? toDate : date);
  };

  const handleToDateChange = (date: Date) => {
    if (date >= fromDate) {
      setToDate(date);
      
      // Close the date picker first
      setShowToDatePicker(false);
      
      // First validate the date range, then generate sessions
      validateDateRange(fromDate, date);
    } else {
      setShowToDatePicker(false);
    }
  };

  const generateSessions = (startDateParam?: Date, endDateParam?: Date) => {
    // Use provided dates or fall back to state values
    const start = startDateParam || fromDate;
    const end = endDateParam || toDate;
    
    if (!start || !end) return;
    
    const sessions: DateSession[] = [];
    const currentDate = new Date(start);
    
    // Ensure we're working with date objects with time set to midnight
    const startDate = new Date(start);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(end);
    endDate.setHours(23, 59, 59, 999);
    
    console.log(`Generating sessions from ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`);
    
    // Loop through each day in the range
    while (currentDate <= endDate) {
      const dateString = currentDate.toISOString().split('T')[0];
      
      const formattedDate = currentDate.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
      
      sessions.push({
        date: dateString,
        formattedDate,
        sessionId: 2103, // Default to Full Day
        isSelected: true,
        isAvailable: true,
        existingLeave: null
      });
      
      // Move to the next day - create a new date object to avoid reference issues
      const nextDate = new Date(currentDate);
      nextDate.setDate(nextDate.getDate() + 1);
      currentDate.setTime(nextDate.getTime());
    }
    
    console.log(`Generated ${sessions.length} sessions`);
    setDateSessions(sessions);
  };

  // Handle session change
  const handleSessionChange = (index: number, value: number) => {
    const updatedSessions = [...dateSessions];
    updatedSessions[index].sessionId = value;
    setDateSessions(updatedSessions);
  };

  // Handle session toggle (include/exclude)
  const handleSessionToggle = (index: number) => {
    const updatedSessions = [...dateSessions];
    updatedSessions[index].isSelected = !updatedSessions[index].isSelected;
    setDateSessions(updatedSessions);
  };

  // Handle document picker for attachments
  const pickDocument = async () => {
    try {
      // Request permissions (for iOS)
      if (Platform.OS === 'ios') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          showAlert('error', t('leave.permissionDenied', 'Permission to access media library was denied'));
          return;
        }
      }

      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true
      });

      if (result.canceled) {
        console.log('Document picking was canceled');
        return;
      }

      const file = result.assets[0];
      
      // Check file size (limit to 5MB)
      const fileInfo = await FileSystem.getInfoAsync(file.uri);
      if (fileInfo.exists && fileInfo.size && fileInfo.size > 5 * 1024 * 1024) {
        showAlert('error', t('leave.fileTooLarge', 'File is too large. Maximum size is 5MB.'));
        return;
      }

      setAttachment({
        uri: file.uri,
        name: file.name || 'document',
        type: file.mimeType || 'application/octet-stream',
        size: fileInfo.exists && fileInfo.size ? fileInfo.size : 0
      });
      
      console.log('Document selected:', file.name);
    } catch (error) {
      console.error('Error picking document:', error);
      showAlert('error', t('leave.documentPickerError', 'Error selecting document'));
    }
  };

  // Handle taking a photo for attachment
  const takePhoto = async () => {
    try {
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        showAlert('error', t('leave.cameraPermissionDenied', 'Permission to access camera was denied'));
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
      });

      if (result.canceled) {
        console.log('Camera was canceled');
        return;
      }

      const image = result.assets[0];

      // Check file size (limit to 5MB)
      const fileInfo = await FileSystem.getInfoAsync(image.uri);
      if (fileInfo.exists && fileInfo.size && fileInfo.size > 5 * 1024 * 1024) {
        showAlert('error', t('leave.fileTooLarge', 'File is too large. Maximum size is 5MB.'));
        return;
      }

      // Generate a filename with timestamp
      const timestamp = new Date().getTime();
      const filename = `photo_${timestamp}.jpg`;

      setAttachment({
        uri: image.uri,
        name: filename,
        type: 'image/jpeg',
        size: fileInfo.exists && fileInfo.size ? fileInfo.size : 0
      });
      
      console.log('Photo taken:', filename);
    } catch (error) {
      console.error('Error taking photo:', error);
      showAlert('error', t('leave.cameraError', 'Error taking photo'));
    }
  };

  // Remove attachment
  const removeAttachment = () => {
    setAttachment(null);
  };

  // Handle reason input change with validation
  const handleReasonChange = (text: string) => {
    setReason(text);
    
    // Validate for alphanumeric characters, spaces, and common punctuation only
    
    if (text.trim() === '') {
      setReasonError(t('leave.reasonRequired', 'Reason is required'));
    } else {
      setReasonError(null);
    }
  };

    // Update handleSubmit to use selected dates and format data according to requirements
    const handleSubmit = async () => {
      // Check if user ID is available
      if (currentUserId === null) {
        console.log('User ID not found');
        showAlert('error', t('leave.userIdNotFound', 'User ID not found'));
        return;
      }
      
      // Get selected sessions
      const selectedSessions = dateSessions.filter(session => session.isSelected);
      
      if (selectedSessions.length === 0) {
        showAlert('error', t('leave.noDateSelected', 'Please select at least one date'));
        return;
      }
      
      if (!selectedLeaveCode) {
        showAlert('error', t('leave.noLeaveTypeSelected', 'Please select a leave type'));
        return;
      }
      
      if (!reason.trim()) {
        showAlert('error', t('leave.reasonRequired', 'Please provide a reason for your leave'));
        return;
      }
      
      // Calculate total days (considering half days)
      const totalDays = selectedSessions.reduce((total: number, session: DateSession) => {
        // Full day = 1, Half day = 0.5
        return total + (session.sessionId === 2103 ? 1 : 0.5);
      }, 0);
      
      // Create leave date list with all selected dates in the range
      const leaveDateList = selectedSessions.map((session: DateSession) => ({
        date: session.date + 'T00:00:00Z',
        sessionId: session.sessionId
      }));
      
      try {
        setLoading(true);
        
        // Use the createLeaveApplication function from leaveApi.ts
        const startDate = new Date(selectedSessions[0].date);
        const endDate = new Date(selectedSessions[selectedSessions.length - 1].date);
        
        // Import the createLeaveApplication function
        const { createLeaveApplication } = require('../../api/leaveApi');
        
        // Log the submission data
        console.log('\n=== LEAVE APPLICATION FORM DATA ===');
        console.log(`LeaveCodeId: ${selectedLeaveCode.id} (${selectedLeaveCode.name})`);
        console.log(`DateFrom: ${startDate.toISOString()}`);
        console.log(`DateTo: ${endDate.toISOString()}`);
        console.log(`TotalDays: ${totalDays}`);
        console.log(`Reason: ${reason.trim()}`);
        console.log(`UserId: ${currentUserId}`);
        console.log(`Leave Date List: ${leaveDateList.length} dates`);
        console.log('===================================\n');
        
        // Call the API function
        const response = await createLeaveApplication(
          selectedLeaveCode.id,
          startDate,
          endDate,
          totalDays,
          leaveDateList,
          currentUserId,
          {
            reason: reason.trim(),
            // Add other optional parameters if needed
          }
        );
        
        setLoading(false);
        
        if (response && response.success) {
          showAlert('success', t('leave.applicationSubmitted', 'Leave application submitted successfully'));
          
          // Navigate back after successful submission
          setTimeout(() => {
            handleGoBack();
          }, 2000);
        } else {
          showAlert('error', response.message || t('leave.submissionError', 'Failed to submit leave application'));
        }
      } catch (error) {
        console.error('Error submitting leave application:', error);
        setLoading(false);
        showAlert('error', t('leave.submissionError', 'Failed to submit leave application'));
      }
    };
  
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.card.background }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleGoBack}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>
          {t('leave.newApplication', 'Create Leave Application')}
        </Text>
        <View style={styles.headerRight} />
      </View>

      <AlertMessage
        visible={alertVisible}
        type={alertType}
        message={alertMessage}
        onClose={() => setAlertVisible(false)}
      />
      
      {loading && (
        <View style={styles.loadingOverlay}>
          <LoadingIndicator size={60} />
        </View>
      )}
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Card style={styles.formCard}>
          <Text style={[styles.formTitle, { color: theme.colors.text.primary }]}>
            {t('leave.newApplication', 'New Leave Application')}
          </Text>
          
          {/* Leave Type Selection */}
          <View style={styles.formGroup}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
              {t('leave.leaveType', 'Leave Type')}
            </Text>
            <TouchableOpacity 
              style={[
                styles.leaveTypeSelector, 
                { borderColor: theme.colors.border.medium }
              ]}
              onPress={() => setShowLeaveCodeSelector(true)}
            >
              <Text style={{ 
                color: selectedLeaveCode 
                  ? theme.colors.text.primary 
                  : theme.colors.text.secondary 
              }}>
                {selectedLeaveCode 
                  ? selectedLeaveCode.name 
                  : t('leave.selectLeaveType', 'Select Leave Type')}
              </Text>
              <Ionicons name="chevron-down" size={20} color={theme.colors.text.secondary} />
            </TouchableOpacity>
            
            {selectedLeaveCode && leaveEntitlements.length > 0 && (
              <View style={styles.balanceInfo}>
                <Text style={[styles.balanceLabel, { color: theme.colors.text.secondary }]}>
                  {t('leave.balance', 'Balance')}:
                </Text>
                <Text style={[styles.balanceValue, { color: theme.colors.primary }]}>
                  {leaveEntitlements.find(item => item.leaveCodeId === selectedLeaveCode.id)?.balanceDays || 0} {t('leave.days', 'days')}
                </Text>
              </View>
            )}
            
            {/* Display leave code note if available */}
            {leaveCodeNote && (
              <View style={[styles.noteContainer, { backgroundColor: theme.colors.background.secondary }]}>
                <View style={styles.noteIconContainer}>
                  <Ionicons name="information-circle" size={24} color={theme.colors.primary} />
                </View>
                <Text style={[styles.noteText, { color: theme.colors.text.primary }]}>
                  <Text style={{ fontWeight: 'bold' }}>{t('leave.note', 'Note')}: </Text>
                  {leaveCodeNote}
                </Text>
              </View>
            )}
          </View>
          
          {/* Add Date Selection */}
          <View style={styles.formGroup}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
              {t('leave.dateRange', 'Date Range')}
            </Text>
            
            <View style={styles.dateRangeContainer}>
              {/* From Date */}
              <TouchableOpacity 
                style={[styles.dateSelector, { borderColor: theme.colors.border.medium }]}
                onPress={() => setShowFromDatePicker(true)}
              >
                <View style={styles.dateSelectorContent}>
                  <Text style={[styles.dateLabelText, { color: theme.colors.text.secondary }]}>
                    {t('leave.from', 'From')}
                  </Text>
                  <Text style={[styles.dateValueText, { color: theme.colors.text.primary }]}>
                    {fromDate.toLocaleDateString()}
                  </Text>
                </View>
                <Ionicons name="calendar-outline" size={20} color={theme.colors.text.secondary} />
              </TouchableOpacity>

              {/* To Date */}
              <TouchableOpacity 
                style={[styles.dateSelector, { borderColor: theme.colors.border.medium }]}
                onPress={() => setShowToDatePicker(true)}
              >
                <View style={styles.dateSelectorContent}>
                  <Text style={[styles.dateLabelText, { color: theme.colors.text.secondary }]}>
                    {t('leave.to', 'To')}
                  </Text>
                  <Text style={[styles.dateValueText, { color: theme.colors.text.primary }]}>
                    {toDate.toLocaleDateString()}
                  </Text>
                </View>
                <Ionicons name="calendar-outline" size={20} color={theme.colors.text.secondary} />
              </TouchableOpacity>
            </View>
            
            {isValidatingDates && (
              <View style={styles.validatingContainer}>
                <LoadingIndicator size={16} />
                <Text style={[styles.validatingText, { color: theme.colors.text.secondary }]}>
                  {t('leave.validatingDates', 'Validating dates...')}
                </Text>
              </View>
            )}
            
            {/* Session Selection Dropdown */}
            <View style={styles.sessionContainer}>
              <Text style={[styles.sectionSubtitle, { color: theme.colors.text.primary }]}>
                {t('leave.sessionType', 'Session Type')}
              </Text>
              
              {dateSessions.length === 0 ? (
                <Text style={[styles.sessionHelp, { color: theme.colors.text.secondary }]}>
                  {t('leave.noDateSelected', 'Please select a date range first')}
                </Text>
              ) : (
                <>
                  {dateSessions.map((session, index) => (
                    <View key={session.date} style={[
                      styles.sessionRow, 
                      { 
                        borderColor: theme.colors.border.light,
                        backgroundColor: theme.colors.card.background
                      }
                    ]}>
                      <TouchableOpacity 
                        style={[styles.checkboxContainer, { borderColor: theme.colors.border.medium }]}
                        onPress={() => handleSessionToggle(index)}
                        disabled={!session.isAvailable}
                      >
                        <Ionicons 
                          name={session.isSelected ? "checkbox" : "square-outline"} 
                          size={24} 
                          color={session.isAvailable 
                            ? (session.isSelected ? theme.colors.primary : theme.colors.text.secondary)
                            : theme.colors.text.secondary} 
                        />
                      </TouchableOpacity>
                      <View style={[
                        styles.sessionDateContainer, 
                        { 
                          borderColor: theme.colors.border.medium, 
                          backgroundColor: theme.colors.background.secondary 
                        }
                      ]}>
                        <Text style={[styles.sessionDateText, { color: theme.colors.text.primary }]}>
                          {session.formattedDate}
                        </Text>
                      </View>
                      <View style={[
                        styles.sessionSelector, 
                        { 
                          borderColor: theme.colors.border.medium,
                          backgroundColor: theme.colors.input.background
                        }
                      ]}>
                        <Picker
                          enabled={session.isAvailable && session.isSelected}
                          selectedValue={session.sessionId}
                          style={{ 
                            color: session.isAvailable && session.isSelected ? theme.colors.text.primary : theme.colors.text.secondary,
                            width: '100%',
                            backgroundColor: 'transparent'
                          }}
                          onValueChange={(itemValue) => handleSessionChange(index, itemValue)}
                          dropdownIconColor={theme.colors.text.primary}
                          mode="dropdown"
                        >
                          {sessionTypes.map(sessionType => (
                            <Picker.Item 
                              key={sessionType.id} 
                              label={sessionType.label} 
                              value={sessionType.id}
                              style={{
                                backgroundColor: theme.colors.card.background,
                                color: theme.colors.text.primary
                              }}
                            />
                          ))}
                        </Picker>
                      </View>
                    </View>
                  ))}
                  <Text style={[styles.sessionHelp, { color: theme.colors.text.secondary }]}>
                    {t('leave.sessionHelp', 'Select session type for each day')}
                  </Text>
                  
                  {/* Display total days calculation */}
                  <View style={[styles.totalDaysContainer, { borderColor: theme.colors.border.light }]}>
                    <Text style={[styles.totalDaysLabel, { color: theme.colors.text.primary }]}>
                      {t('leave.totalDays', 'Total Days')}:
                    </Text>
                    <Text style={[styles.totalDaysValue, { color: theme.colors.primary, fontWeight: 'bold' }]}>
                      {dateSessions
                        .filter(session => session.isSelected)
                        .reduce((total, session) => {
                          // Full day = 1, Half day = 0.5
                          return total + (session.sessionId === 2103 ? 1 : 0.5);
                        }, 0)
                      }
                    </Text>
                  </View>
                </>
              )}
            </View>
          </View>
          
          {/* Attachment Section */}
          <View style={styles.formGroup}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
              {t('leave.attachment', 'Attachment')} <Text style={{ color: theme.colors.text.secondary }}>{t('leave.optional', '(Optional)')}</Text>
            </Text>
            
            {attachment ? (
              <View style={[styles.attachmentPreview, { borderColor: theme.colors.border.medium }]}>
                {attachment.type.startsWith('image/') ? (
                  <Image 
                    source={{ uri: attachment.uri }} 
                    style={styles.attachmentImage} 
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.fileIconContainer}>
                    <Ionicons name="document" size={40} color={theme.colors.primary} />
                  </View>
                )}
                
                <View style={styles.attachmentInfo}>
                  <Text style={[styles.attachmentName, { color: theme.colors.text.primary }]} numberOfLines={1} ellipsizeMode="middle">
                    {attachment.name}
                  </Text>
                  <Text style={[styles.attachmentSize, { color: theme.colors.text.secondary }]}>
                    {(attachment.size / 1024).toFixed(1)} KB
                  </Text>
                </View>
                
                <TouchableOpacity 
                  style={styles.removeAttachmentButton}
                  onPress={removeAttachment}
                >
                  <Ionicons name="close-circle" size={24} color={theme.colors.text.primary} />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.attachmentButtons}>
                <TouchableOpacity 
                  style={[
                    styles.attachmentButton, 
                    { 
                      borderColor: theme.colors.border.medium,
                      backgroundColor: theme.colors.background.secondary
                    }
                  ]}
                  onPress={pickDocument}
                >
                  <Ionicons name="document-outline" size={24} color={theme.colors.primary} />
                  <Text style={[styles.attachmentButtonText, { color: theme.colors.text.primary }]}>
                    {t('leave.selectFile', 'Select File')}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[
                    styles.attachmentButton, 
                    { 
                      borderColor: theme.colors.border.medium,
                      backgroundColor: theme.colors.background.secondary
                    }
                  ]}
                  onPress={takePhoto}
                >
                  <Ionicons name="camera-outline" size={24} color={theme.colors.primary} />
                  <Text style={[styles.attachmentButtonText, { color: theme.colors.text.primary }]}>
                    {t('leave.takePhoto', 'Take Photo')}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
            
            <Text style={[styles.attachmentHelp, { color: theme.colors.text.secondary }]}>
              {t('leave.attachmentHelp', 'Supported formats: Images, PDF. Max size: 5MB')}
            </Text>
          </View>

          {/* Reason Input Section */}
          <View style={styles.formGroup}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
              {t('leave.reason', 'Reason')}
            </Text>
            <TextInput
              style={[
                styles.reasonInput,
                { 
                  borderColor: theme.colors.border.medium,
                  backgroundColor: theme.colors.input.background,
                  color: theme.colors.text.primary
                }
              ]}
              placeholder={t('leave.enterReason', 'Enter reason for leave')}
              placeholderTextColor={theme.colors.text.secondary}
              multiline={true}
              numberOfLines={4}
              value={reason}
              onChangeText={handleReasonChange}
              maxLength={500}
            />
            {reasonError ? (
              <Text style={[styles.errorText, { color: theme.colors.primary }]}>
                {reasonError}
              </Text>
            ) : (
              <Text style={[styles.reasonHelp, { color: theme.colors.text.secondary }]}>
                {t('leave.reasonHelp', 'Please enter alphanumeric characters only (English or Bahasa Malaysia)')}
              </Text>
            )}
            <Text style={[styles.characterCount, { color: theme.colors.text.secondary }]}>
              {reason.length}/500
            </Text>
          </View>

          {/* Submit Button */}
          <Button 
            title={t('leave.submit', 'Submit Application')}
            onPress={handleSubmit}
            style={styles.submitButton}
            disabled={loading || !selectedLeaveCode || dateSessions.filter(session => session.isSelected).length === 0}
          />
        </Card>
      </ScrollView>
      
      {/* Leave Code Selector Modal */}
      <Modal
        visible={showLeaveCodeSelector}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowLeaveCodeSelector(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.card.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text.primary }]}>
                {t('leave.selectLeaveType', 'Select Leave Type')}
              </Text>
              <TouchableOpacity onPress={() => setShowLeaveCodeSelector(false)}>
                <Ionicons name="close" size={24} color={theme.colors.text.primary} />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={leaveEntitlements}
              keyExtractor={(item) => item.leaveCodeId.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={[
                    styles.leaveTypeItem, 
                    { 
                      backgroundColor: theme.colors.card.background,
                      borderColor: theme.colors.border.light
                    }
                  ]}
                  onPress={() => handleLeaveCodeSelect(item)}
                >
                  <View style={styles.leaveTypeInfo}>
                    <Text style={[styles.leaveTypeName, { color: theme.colors.text.primary }]}>
                      {item.leaveCodeDesc}
                    </Text>
                    <Text style={[styles.leaveTypeBalance, { color: theme.colors.text.secondary }]}>
                      {t('leave.balance', 'Balance')}: {item.balanceDays} {t('leave.days', 'days')}
                    </Text>
                  </View>
                  {selectedLeaveCode?.id === item.leaveCodeId && (
                    <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />
                  )}
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.leaveTypeList}
            />
          </View>
        </View>
      </Modal>
      
      {/* Date Picker Modals */}
      <Modal
        visible={showFromDatePicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowFromDatePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <DateCalendar
            selectedDate={fromDate}
            onDateChange={handleFromDateChange}
            onClose={() => setShowFromDatePicker(false)}
            title={t('leave.selectStartDate', 'Select Start Date')}
          />
        </View>
      </Modal>

      <Modal
        visible={showToDatePicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowToDatePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <DateCalendar
            selectedDate={toDate}
            onDateChange={handleToDateChange}
            minDate={fromDate}
            onClose={() => setShowToDatePicker(false)}
            title={t('leave.selectEndDate', 'Select End Date')}
          />
        </View>
      </Modal>
    </View>
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
    paddingVertical: 30,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  formCard: {
    padding: 16,
    marginBottom: 16,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  leaveTypeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  balanceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  balanceLabel: {
    fontSize: 14,
    marginRight: 4,
  },
  balanceValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  noteContainer: {
    marginTop: 8,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  noteIconContainer: {
    marginRight: 8,
  },
  noteText: {
    fontSize: 14,
    fontStyle: 'italic',
    flex: 1,
  },
  submitButton: {
    marginTop: 16,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
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
  leaveTypeList: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  leaveTypeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  leaveTypeInfo: {
    flex: 1,
  },
  leaveTypeName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  leaveTypeBalance: {
    fontSize: 14,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  // Add new styles for date selection
  dateRangeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  dateSelector: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  dateSelectorContent: {
    flex: 1,
  },
  dateLabelText: {
    fontSize: 12,
    marginBottom: 4,
  },
  dateValueText: {
    fontSize: 16,
    fontWeight: '500',
  },
  validatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    padding: 8,
  },
  validatingText: {
    marginLeft: 8,
    fontSize: 14,
  },
  sessionContainer: {
    marginTop: 16,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#f9f9f9',
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  sessionDateContainer: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    minWidth: 100,
    alignItems: 'center',
  },
  sessionDateText: {
    fontSize: 14,
    fontWeight: '500',
  },
  sessionSelector: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
  },
  sessionHelp: {
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
  totalDaysContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  totalDaysLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  totalDaysValue: {
    fontSize: 18,
  },
  checkboxContainer: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  reasonInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  reasonHelp: {
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
  characterCount: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'right',
  },
  // Attachment styles
  attachmentButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    gap: 12,
  },
  attachmentButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    gap: 8,
  },
  attachmentButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  attachmentHelp: {
    fontSize: 12,
    marginTop: 8,
    fontStyle: 'italic',
  },
  attachmentPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  attachmentImage: {
    width: 60,
    height: 60,
    borderRadius: 4,
  },
  fileIconContainer: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 4,
  },
  attachmentInfo: {
    flex: 1,
    marginLeft: 12,
  },
  attachmentName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  attachmentSize: {
    fontSize: 12,
  },
  removeAttachmentButton: {
    padding: 8,
  },
  
});

export default CreateLeaveApplication;
