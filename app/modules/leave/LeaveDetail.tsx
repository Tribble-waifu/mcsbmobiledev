import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  StatusBar,
  ActivityIndicator
} from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { format, parseISO } from 'date-fns';

// Import components
import AlertMessage from '../../components/AlertMessage';
import Button from '../../components/Button';
import Card from '../../components/Card';
import CustomAlert from '../../components/CustomAlert';
import LoadingIndicator from '../../components/LoadingIndicator';

// Import theme
import useTheme from '../../themes/useTheme';

// Import API functions
import { getLeaveDetail, LeaveHistory, cancelLeaveRequest } from '../../api/leaveApi';

// Define status colors
const STATUS_COLORS = {
  A: '#4CAF50', // Approved - Green
  P: '#FF9800', // Pending - Orange
  R: '#F44336', // Rejected - Red
  L: '#9E9E9E', // Cancelled - Grey
};

// Define status display names
const STATUS_NAMES = {
  A: 'Approved',
  P: 'Pending',
  R: 'Rejected',
  L: 'Cancelled',
};

export default function LeaveDetail() {
  const { t } = useTranslation();
  const { theme, isDark } = useTheme();
  const params = useLocalSearchParams();
  const leaveId = Number(params.id);

  // State variables
  const [loading, setLoading] = useState(true);
  const [leaveDetail, setLeaveDetail] = useState<LeaveHistory | null>(null);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<'success' | 'error' | 'warning' | 'info'>('info');
  const [confirmAlertVisible, setConfirmAlertVisible] = useState(false);
  const [confirmAlertMessage, setConfirmAlertMessage] = useState('');
  const [customAlertVisible, setCustomAlertVisible] = useState(false);
  const [customAlertMessage, setCustomAlertMessage] = useState('');

  // Load leave detail
  const loadLeaveDetail = useCallback(async () => {
    try {
      setLoading(true);
      const detail = await getLeaveDetail(leaveId);
      setLeaveDetail(detail);
    } catch (error) {
      console.error('Error loading leave detail:', error);
      showAlert('error', t('leave.errorLoadingDetail', 'Error loading leave detail'));
    } finally {
      setLoading(false);
    }
  }, [leaveId, t]);

  // Initial load
  useEffect(() => {
    loadLeaveDetail();
  }, [loadLeaveDetail]);

  // Show alert message
  const showAlert = (type: 'success' | 'error' | 'warning' | 'info', message: string) => {
    setAlertType(type);
    setAlertMessage(message);
    setAlertVisible(true);
  };

  // Handle cancel leave request
  const handleCancelRequest = () => {
    // Navigate to CancelLeaveApplication screen with leave details
    if (leaveDetail) {
      router.push({
        pathname: "/modules/leave/CancelLeaveApplication",
        params: {
          id: leaveDetail.id,
          leaveType: leaveDetail.leaveCodeDesc,
          dateFrom: formatDate(leaveDetail.dateFrom),
          dateTo: formatDate(leaveDetail.dateTo)
        }
      });
    }
  };

  // Confirm cancel leave request
  const confirmCancelRequest = async () => {
    if (leaveDetail) {
      try {
        setLoading(true);
        await cancelLeaveRequest(leaveDetail.id);
        setConfirmAlertVisible(false);
        showAlert('success', t('leave.requestCancelled', 'Leave request cancelled successfully'));
        await loadLeaveDetail();
      } catch (error) {
        console.error('Error cancelling leave request:', error);
        setConfirmAlertVisible(false);
        showAlert('error', t('leave.errorCancellingRequest', 'Error cancelling leave request'));
        setLoading(false);
      }
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'dd MMM yyyy');
    } catch (error) {
      return dateString;
    }
  };

  // Format date and time for display
  const formatDateTime = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'dd MMM yyyy, HH:mm');
    } catch (error) {
      return dateString;
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

      <CustomAlert
        visible={customAlertVisible}
        message={customAlertMessage}
        onClose={() => setCustomAlertVisible(false)}
      />
      
      {confirmAlertVisible && (
        <View style={[styles.confirmAlertContainer, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.confirmAlertBox, { backgroundColor: theme.colors.card.background }]}>
            <Text style={[styles.confirmAlertTitle, { color: theme.colors.text.primary }]}>
              {t('leave.confirmAction', 'Confirm Action')}
            </Text>
            <Text style={[styles.confirmAlertMessage, { color: theme.colors.text.secondary }]}>
              {confirmAlertMessage}
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
                onPress={confirmCancelRequest}
                variant="primary"
                size="small"
                style={styles.confirmAlertButton}
              />
            </View>
          </View>
        </View>
      )}

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
          {t('leave.leaveDetail', 'Leave Detail')}
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
      ) : leaveDetail ? (
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Status Card */}
          <Card style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <Text style={[styles.statusTitle, { color: theme.colors.text.primary }]}>
                {t('leave.status', 'Status')}
              </Text>
              <View 
                style={[
                  styles.statusBadge, 
                  { 
                    backgroundColor: (STATUS_COLORS[leaveDetail.approvalStatus as keyof typeof STATUS_COLORS] || '#9E9E9E') + '20',
                    borderColor: STATUS_COLORS[leaveDetail.approvalStatus as keyof typeof STATUS_COLORS] || '#9E9E9E'
                  }
                ]}
              >
                <Text 
                  style={[
                    styles.statusText, 
                    { color: STATUS_COLORS[leaveDetail.approvalStatus as keyof typeof STATUS_COLORS] || '#9E9E9E' }
                  ]}
                >
                  {leaveDetail.approvalStatusDisplay || STATUS_NAMES[leaveDetail.approvalStatus as keyof typeof STATUS_NAMES] || 'Unknown'}
                </Text>
              </View>
            </View>
          </Card>

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
                {leaveDetail.leaveCodeDesc}
              </Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: theme.colors.text.secondary }]}>
                {t('leave.from', 'From')}:
              </Text>
              <Text style={[styles.detailValue, { color: theme.colors.text.primary }]}>
                {formatDate(leaveDetail.dateFrom)}
              </Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: theme.colors.text.secondary }]}>
                {t('leave.to', 'To')}:
              </Text>
              <Text style={[styles.detailValue, { color: theme.colors.text.primary }]}>
                {formatDate(leaveDetail.dateTo)}
              </Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: theme.colors.text.secondary }]}>
                {t('leave.totalDays', 'Total Days')}:
              </Text>
              <Text style={[styles.detailValue, { color: theme.colors.text.primary }]}>
                {leaveDetail.totalDays} {leaveDetail.totalDays === 1 ? t('leave.day', 'day') : t('leave.days', 'days')}
              </Text>
            </View>
            
            {leaveDetail.reason && (
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.colors.text.secondary }]}>
                  {t('leave.reason', 'Reason')}:
                </Text>
                <Text style={[styles.detailValue, { color: theme.colors.text.primary }]}>
                  {leaveDetail.reason}
                </Text>
              </View>
            )}
            
            {leaveDetail.cancellationReason && (
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.colors.text.secondary }]}>
                  {t('leave.cancellationReason', 'Cancellation Reason')}:
                </Text>
                <Text style={[styles.detailValue, { color: theme.colors.text.primary }]}>
                  {leaveDetail.cancellationReason}
                </Text>
              </View>
            )}
            
            {leaveDetail.remark && (
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.colors.text.secondary }]}>
                  {t('leave.remarks', 'Remarks')}:
                </Text>
                <Text style={[styles.detailValue, { color: theme.colors.text.primary }]}>
                  {leaveDetail.remark}
                </Text>
              </View>
            )}
          </Card>

          {/* Leave Sessions Card */}
          {leaveDetail.leaveDates && leaveDetail.leaveDates.length > 0 && (
            <Card style={styles.detailCard}>
              <Text style={[styles.cardTitle, { color: theme.colors.text.primary }]}>
                {t('leave.leaveSessions', 'Leave Sessions')}
              </Text>
              
              {leaveDetail.leaveDates.map((date, index) => (
                <View key={index} style={styles.sessionRow}>
                  <Text style={[styles.sessionDate, { color: theme.colors.text.primary }]}>
                    {formatDate(date.date)}
                  </Text>
                  <View 
                    style={[
                      styles.sessionBadge, 
                      { 
                        backgroundColor: theme.colors.primary + '20',
                        borderColor: theme.colors.primary
                      }
                    ]}
                  >
                    <Text style={[styles.sessionText, { color: theme.colors.primary }]}>
                      {date.session}
                    </Text>
                  </View>
                </View>
              ))}
            </Card>
          )}

          {/* Application Info Card */}
          <Card style={styles.detailCard}>
            <Text style={[styles.cardTitle, { color: theme.colors.text.primary }]}>
              {t('leave.applicationInfo', 'Application Info')}
            </Text>
            
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: theme.colors.text.secondary }]}>
                {t('leave.appliedBy', 'Applied By')}:
              </Text>
              <Text style={[styles.detailValue, { color: theme.colors.text.primary }]}>
                {leaveDetail.createByUsername}
              </Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: theme.colors.text.secondary }]}>
                {t('leave.appliedOn', 'Applied On')}:
              </Text>
              <Text style={[styles.detailValue, { color: theme.colors.text.primary }]}>
                {formatDateTime(leaveDetail.createdDate)}
              </Text>
            </View>
            
            {leaveDetail.backupPersonEmployeeName && (
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.colors.text.secondary }]}>
                  {t('leave.backupPerson', 'Backup Person')}:
                </Text>
                <Text style={[styles.detailValue, { color: theme.colors.text.primary }]}>
                  {leaveDetail.backupPersonEmployeeName}
                </Text>
              </View>
            )}
          </Card>

          {/* Action Buttons */}
          {leaveDetail.approvalStatus === 'P' && (
            <Button
              title={t('leave.cancelRequest', 'Cancel Request')}
              onPress={handleCancelRequest}
              variant="outline"
              size="medium"
              icon="close-circle-outline"
              style={styles.actionButton}
            />
          )}
        </ScrollView>
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons 
            name="document-text-outline" 
            size={80} 
            color={theme.colors.text.secondary} 
          />
          <Text style={[styles.emptyTitle, { color: theme.colors.text.primary }]}>
            {t('leave.noLeaveFound', 'Leave Not Found')}
          </Text>
          <Text style={[styles.emptySubtitle, { color: theme.colors.text.secondary }]}>
            {t('leave.leaveNotFoundDesc', 'The requested leave application could not be found.')}
          </Text>
          <Button
            title={t('common.goBack', 'Go Back')}
            onPress={() => router.back()}
            variant="primary"
            size="medium"
            icon="arrow-back-outline"
            style={styles.goBackButton}
          />
        </View>
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
    marginLeft: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  statusCard: {
    marginBottom: 16,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  detailCard: {
    marginBottom: 16,
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
  sessionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingVertical: 4,
  },
  sessionDate: {
    fontSize: 14,
    fontWeight: '500',
  },
  sessionBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  sessionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  actionButton: {
    marginTop: 16,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    marginBottom: 24,
  },
  goBackButton: {
    marginTop: 16,
  },
});