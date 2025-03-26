import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Modal,
  FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';

// Components
import Button from '../../components/Button';
import Card from '../../components/Card';
import LoadingIndicator from '../../components/LoadingIndicator';
import AlertMessage from '../../components/AlertMessage';

// Utilities and API
import useTheme from '../../themes/useTheme';
import { 
  getLeaveEntitlement, 
  getLeaveCodeSetting
} from '../../api/leaveApi';

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

const CreateLeaveApplication: React.FC = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { theme } = useTheme();
  
  // State for leave application form
  const [loading, setLoading] = useState(false);
  const [leaveEntitlements, setLeaveEntitlements] = useState<LeaveEntitlement[]>([]);
  const [selectedLeaveCode, setSelectedLeaveCode] = useState<{id: number, name: string} | null>(null);
  const [leaveCodeNote, setLeaveCodeNote] = useState<string | null>(null);
  
  // UI state
  const [showLeaveCodeSelector, setShowLeaveCodeSelector] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<'success' | 'error' | 'info' | 'warning'>('info');
  
  // Load leave entitlements when component mounts
  useEffect(() => {
    loadLeaveEntitlements();
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
    
    // Set a sample note for demonstration
    if (item.leaveCodeId === 1) {
      setLeaveCodeNote('This leave type requires approval from your manager.');
    } else if (item.leaveCodeId === 2) {
      setLeaveCodeNote('Medical certificate is required for sick leave more than 2 days.');
    } else {
      setLeaveCodeNote(null);
    }
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
  
  // Replace handleContinue with handleSubmit
  const handleSubmit = () => {
    // Validate inputs
    if (!selectedLeaveCode) {
      showAlert('error', t('leave.selectLeaveTypeFirst', 'Please select a leave type first'));
      return;
    }
    
    setLoading(true);
    
    // Sample leave application data
    const leaveApplicationData = {
      LeaveCodeId: selectedLeaveCode.id,
      Year: new Date().getFullYear(),
      DateFrom: '2024-12-06T00:00:00Z',
      DateTo: '2024-12-06T00:00:00Z',
      TotalDays: 1,
      Reason: 'TestNewLeave',
      LeaveDateList: [
        {
          Date: '2024-12-06T00:00:00.00Z',
          SessionId: 2103 // Full day
        }
      ],
      UserId: 8
    };
    
    // Log the submission data
    console.log('Submitting leave application with data:');
    console.log(`LeaveCodeId: ${leaveApplicationData.LeaveCodeId}`);
    console.log(`Year: ${leaveApplicationData.Year}`);
    console.log(`DateFrom: ${leaveApplicationData.DateFrom}`);
    console.log(`DateTo: ${leaveApplicationData.DateTo}`);
    console.log(`TotalDays: ${leaveApplicationData.TotalDays}`);
    console.log(`Reason: ${leaveApplicationData.Reason}`);
    console.log(`LeaveDateList[0].Date: ${leaveApplicationData.LeaveDateList[0].Date}`);
    console.log(`LeaveDateList[0].SessionId: ${leaveApplicationData.LeaveDateList[0].SessionId}`);
    console.log(`UserId: ${leaveApplicationData.UserId}`);
    
    // Simulate API call delay
    setTimeout(() => {
      setLoading(false);
      // Show success message
      showAlert('success', t('leave.applicationSubmitted', 'Leave application submitted successfully'));
    }, 1000);
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
          
          {/* Submit Button - replacing Continue Button */}
          <Button 
            title={t('leave.submit', 'Submit Application')}
            onPress={handleSubmit}
            style={styles.submitButton}
            disabled={loading || !selectedLeaveCode}
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
    paddingVertical: 12,
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
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  noteIconContainer: {
    marginRight: 8,
  },
  noteText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
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
});

export default CreateLeaveApplication;