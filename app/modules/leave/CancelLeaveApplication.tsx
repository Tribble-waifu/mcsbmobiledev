import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput,
  StatusBar,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

// Import components
import AlertMessage from '../../components/AlertMessage';
import Button from '../../components/Button';
import Card from '../../components/Card';
import LoadingIndicator from '../../components/LoadingIndicator';

// Import theme
import useTheme from '../../themes/useTheme';

// Import API functions
import { cancelLeave } from '../../api/leaveApi';

export default function CancelLeaveApplication() {
  const { t } = useTranslation();
  const { theme, isDark } = useTheme();
  const params = useLocalSearchParams();
  
  // Get leave ID and leave details from params
  const leaveId = Number(params.id);
  const leaveType = params.leaveType as string;
  const dateFrom = params.dateFrom as string;
  const dateTo = params.dateTo as string;
  
  // State variables
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState<string | null>(null);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<'success' | 'error' | 'warning' | 'info'>('info');
  const [confirmAlertVisible, setConfirmAlertVisible] = useState(false);

  // Show alert message
  const showAlert = (type: 'success' | 'error' | 'warning' | 'info', message: string) => {
    setAlertType(type);
    setAlertMessage(message);
    setAlertVisible(true);
  };

  // Handle reason input change
  const handleReasonChange = (text: string) => {
    setReason(text);
    
    if (text.trim() === '') {
      setReasonError(t('leave.reasonRequired', 'Reason is required'));
    } else {
      setReasonError(null);
    }
  };

  // Handle cancel button press
  const handleCancel = () => {
    router.back();
  };

  // Handle submit button press
  const handleSubmit = () => {
    // Validate reason
    if (reason.trim() === '') {
      setReasonError(t('leave.reasonRequired', 'Reason is required'));
      return;
    }
    
    // Show confirmation dialog
    setConfirmAlertVisible(true);
  };

  // Confirm cancellation
  const confirmCancellation = async () => {
    try {
      setLoading(true);
      setConfirmAlertVisible(false);
      
      // Call the API to cancel the leave
      const response = await cancelLeave(leaveId, reason.trim());
      
      if (response && response.success) {
        showAlert('success', t('leave.requestCancelled', 'Leave request cancelled successfully'));
        
        // Navigate back after a short delay
        setTimeout(() => {
          // Use router.back() instead of router.replace with an invalid path
          router.back();
        }, 1500);
      } else {
        showAlert('error', response?.message || t('leave.errorCancellingRequest', 'Error cancelling leave request'));
        setLoading(false);
      }
    } catch (error) {
      console.error('Error cancelling leave request:', error);
      showAlert('error', t('leave.errorCancellingRequest', 'Error cancelling leave request'));
      setLoading(false);
    }
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
      
      {/* Confirmation Dialog */}
      {confirmAlertVisible && (
        <View style={[styles.confirmAlertContainer, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.confirmAlertBox, { backgroundColor: theme.colors.card.background }]}>
            <Text style={[styles.confirmAlertTitle, { color: theme.colors.text.primary }]}>
              {t('leave.confirmAction', 'Confirm Action')}
            </Text>
            <Text style={[styles.confirmAlertMessage, { color: theme.colors.text.secondary }]}>
              {t('leave.confirmCancelRequest', 'Are you sure you want to cancel this leave request?')}
            </Text>
            <View style={styles.confirmAlertButtons}>
              <Button
                title={t('common.no', 'No')}
                onPress={() => setConfirmAlertVisible(false)}
                variant="outline"
                size="small"
                style={styles.confirmAlertButton}
              />
              <Button
                title={t('common.yes', 'Yes')}
                onPress={confirmCancellation}
                variant="primary"
                size="small"
                style={styles.confirmAlertButton}
              />
            </View>
          </View>
        </View>
      )}
      
      {/* Loading Overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <LoadingIndicator size={60} />
        </View>
      )}
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.card.background }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleCancel}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>
          {t('leave.cancelLeave', 'Cancel Leave Request')}
        </Text>
        <View style={styles.headerRight} />
      </View>
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Leave Details Card */}
          <Card style={styles.detailCard}>
            <Text style={[styles.cardTitle, { color: theme.colors.text.primary }]}>
              {t('leave.leaveDetails', 'Leave Details')}
            </Text>
            
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: theme.colors.text.secondary }]}>
                {t('leave.leaveType', 'Leave Type')}:
              </Text>
              <Text style={[styles.detailValue, { color: theme.colors.text.primary }]}>
                {leaveType || t('leave.notSpecified', 'Not specified')}
              </Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: theme.colors.text.secondary }]}>
                {t('leave.from', 'From')}:
              </Text>
              <Text style={[styles.detailValue, { color: theme.colors.text.primary }]}>
                {dateFrom || t('leave.notSpecified', 'Not specified')}
              </Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: theme.colors.text.secondary }]}>
                {t('leave.to', 'To')}:
              </Text>
              <Text style={[styles.detailValue, { color: theme.colors.text.primary }]}>
                {dateTo || t('leave.notSpecified', 'Not specified')}
              </Text>
            </View>
          </Card>
          
          {/* Cancellation Reason Card */}
          <Card style={styles.reasonCard}>
            <Text style={[styles.cardTitle, { color: theme.colors.text.primary }]}>
              {t('leave.cancellationReason', 'Cancellation Reason')}
            </Text>
            
            <Text style={[styles.reasonDescription, { color: theme.colors.text.secondary }]}>
              {t('leave.cancellationReasonDesc', 'Please provide a reason for cancelling this leave request.')}
            </Text>
            
            <TextInput
              style={[
                styles.reasonInput,
                { 
                  backgroundColor: theme.colors.background.secondary,
                  color: theme.colors.text.primary,
                  borderColor: reasonError ? theme.colors.accent : theme.colors.border.medium
                }
              ]}
              placeholder={t('leave.enterReason', 'Enter reason here...')}
              placeholderTextColor={theme.colors.text.secondary}
              value={reason}
              onChangeText={handleReasonChange}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            
            {reasonError && (
              <Text style={[styles.errorText, { color: theme.colors.accent }]}>
                {reasonError}
              </Text>
            )}
          </Card>
          
          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <Button
              title={t('common.cancel', 'Cancel')}
              onPress={handleCancel}
              variant="outline"
              size="medium"
              // Fix: Use a single style object instead of an array
              style={styles.cancelButton}
            />
            <Button
              title={t('leave.submitCancellation', 'Submit Cancellation')}
              onPress={handleSubmit}
              variant="primary"
              size="medium"
              // Fix: Use a single style object instead of an array
              style={styles.submitButton}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
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
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  detailCard: {
    marginBottom: 16,
  },
  reasonCard: {
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  detailLabel: {
    width: '40%',
    fontSize: 14,
    fontWeight: '500',
  },
  detailValue: {
    width: '60%',
    fontSize: 14,
  },
  reasonDescription: {
    fontSize: 14,
    marginBottom: 12,
  },
  reasonInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    minHeight: 120,
    fontSize: 14,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  // Fix: Combine the styles into single objects
  cancelButton: {
    flex: 1,
    marginRight: 8,
  },
  submitButton: {
    flex: 1,
    marginLeft: 8,
  },
  confirmAlertContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  confirmAlertBox: {
    width: '80%',
    borderRadius: 8,
    padding: 16,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  confirmAlertTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  confirmAlertMessage: {
    fontSize: 14,
    marginBottom: 16,
  },
  confirmAlertButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  confirmAlertButton: {
    marginLeft: 8,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
});