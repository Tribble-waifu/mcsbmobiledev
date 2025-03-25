import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  RefreshControl,
  StatusBar,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { format, parseISO } from 'date-fns';

// Import components
import AlertMessage from '../../components/AlertMessage';
import Button from '../../components/Button';
import Card from '../../components/Card';
import CustomAlert from '../../components/CustomAlert';
import LoadingIndicator from '../../components/LoadingIndicator';
import YearPickerModal from '../../components/YearPickerModal';

// Import theme
import useTheme from '../../themes/useTheme';

// Import API functions
import { getLeaveHistory, LeaveHistory, cancelLeaveRequest } from '../../api/leaveApi';

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

export default function ViewLeaveApplication() {
  const { t } = useTranslation();
  const { theme, isDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [leaveHistory, setLeaveHistory] = useState<LeaveHistory[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<LeaveHistory[]>([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<'success' | 'error' | 'warning' | 'info'>('info');
  const [confirmAlertVisible, setConfirmAlertVisible] = useState(false);
  const [confirmAlertMessage, setConfirmAlertMessage] = useState('');
  const [selectedLeaveId, setSelectedLeaveId] = useState<number | null>(null);
  const [detailsVisible, setDetailsVisible] = useState<number | null>(null);
  // Add isEditingYear state
  const [isEditingYear, setIsEditingYear] = useState(false);

  // Load leave history
  const loadLeaveHistory = useCallback(async () => {
    try {
      setLoading(true);
      const history = await getLeaveHistory(selectedYear);
      setLeaveHistory(history);
      applyFilters(history, statusFilter);
      setLoading(false);
    } catch (error) {
      console.error('Error loading leave history:', error);
      setLoading(false);
      showAlert('error', t('leave.errorLoadingHistory', 'Error loading leave history'));
    }
  }, [selectedYear, statusFilter, t]);

  // Initial load
  useEffect(() => {
    loadLeaveHistory();
  }, [loadLeaveHistory]);

  // Apply filters to leave history
  const applyFilters = (history: LeaveHistory[], status: string | null) => {
    let filtered = [...history];
    
    // Apply status filter if selected
    if (status) {
      filtered = filtered.filter(item => item.approvalStatus === status);
    }
    
    // Sort by date (newest first)
    filtered.sort((a, b) => {
      return new Date(b.dateFrom).getTime() - new Date(a.dateFrom).getTime();
    });
    
    setFilteredHistory(filtered);
  };

  // Handle refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await loadLeaveHistory();
    setRefreshing(false);
  };

  // Show alert message
  const showAlert = (type: 'success' | 'error' | 'warning' | 'info', message: string) => {
    setAlertType(type);
    setAlertMessage(message);
    setAlertVisible(true);
  };

  // Handle year change
  const changeYear = (year: number) => {
    setSelectedYear(year);
  };

  // Handle status filter change
  const changeStatusFilter = (status: string | null) => {
    setStatusFilter(status);
    applyFilters(leaveHistory, status);
  };

  // Handle cancel leave request
  const handleCancelRequest = (leaveId: number) => {
    setSelectedLeaveId(leaveId);
    setConfirmAlertMessage(t('leave.confirmCancelRequest', 'Are you sure you want to cancel this leave request?'));
    setConfirmAlertVisible(true);
  };

  // Confirm cancel leave request
  const confirmCancelRequest = async () => {
    if (selectedLeaveId) {
      try {
        setLoading(true);
        await cancelLeaveRequest(selectedLeaveId);
        setConfirmAlertVisible(false);
        showAlert('success', t('leave.requestCancelled', 'Leave request cancelled successfully'));
        await loadLeaveHistory();
      } catch (error) {
        console.error('Error cancelling leave request:', error);
        setConfirmAlertVisible(false);
        showAlert('error', t('leave.errorCancellingRequest', 'Error cancelling leave request'));
        setLoading(false);
      }
    }
  };

  // Toggle leave details visibility
  const toggleDetails = (id: number) => {
    if (detailsVisible === id) {
      setDetailsVisible(null);
    } else {
      setDetailsVisible(id);
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

  // Render leave item
  const renderLeaveItem = ({ item }: { item: LeaveHistory }) => {
    const isExpanded = detailsVisible === item.id;
    const isPending = item.approvalStatus === 'P';
    const statusColor = STATUS_COLORS[item.approvalStatus as keyof typeof STATUS_COLORS] || '#9E9E9E';
    
    return (
      <Card
        style={styles.leaveCard}
        elevation={2}
        borderRadius={12}
      >
        <View style={styles.leaveHeader}>
          <View style={styles.leaveTypeContainer}>
            <View style={[styles.leaveTypeTag, { backgroundColor: statusColor + '20' }]}>
              <Text style={[styles.leaveTypeText, { color: statusColor }]}>
                {item.leaveCodeDesc}
              </Text>
            </View>
            <View style={[styles.statusTag, { backgroundColor: statusColor + '20' }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>
                {item.approvalStatusDisplay || STATUS_NAMES[item.approvalStatus as keyof typeof STATUS_NAMES] || 'Unknown'}
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => toggleDetails(item.id)}>
            <Ionicons 
              name={isExpanded ? 'chevron-up' : 'chevron-down'} 
              size={20} 
              color={theme.colors.text.secondary} 
            />
          </TouchableOpacity>
        </View>
        
        <View style={styles.leaveDates}>
          <View style={styles.dateContainer}>
            <Text style={[styles.dateLabel, { color: theme.colors.text.secondary }]}>
              {t('leave.from', 'From')}:
            </Text>
            <Text style={[styles.dateValue, { color: theme.colors.text.primary }]}>
              {formatDate(item.dateFrom)}
            </Text>
          </View>
          <View style={styles.dateContainer}>
            <Text style={[styles.dateLabel, { color: theme.colors.text.secondary }]}>
              {t('leave.to', 'To')}:
            </Text>
            <Text style={[styles.dateValue, { color: theme.colors.text.primary }]}>
              {formatDate(item.dateTo)}
            </Text>
          </View>
          <View style={styles.daysContainer}>
            <Text style={[styles.daysValue, { color: theme.colors.text.primary }]}>
              {item.totalDays} {item.totalDays === 1 ? t('leave.day', 'day') : t('leave.days', 'days')}
            </Text>
          </View>
        </View>
        
        {isExpanded && (
          <View style={styles.expandedDetails}>
            <View style={styles.divider} />
            
            {item.reason && (
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.colors.text.secondary }]}>
                  {t('leave.reason', 'Reason')}:
                </Text>
                <Text style={[styles.detailValue, { color: theme.colors.text.primary }]}>
                  {item.reason}
                </Text>
              </View>
            )}
            
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: theme.colors.text.secondary }]}>
                {t('leave.appliedOn', 'Applied On')}:
              </Text>
              <Text style={[styles.detailValue, { color: theme.colors.text.primary }]}>
                {formatDate(item.createdDate)}
              </Text>
            </View>
            
            {item.leaveDates && item.leaveDates.length > 0 && (
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.colors.text.secondary }]}>
                  {t('leave.sessions', 'Sessions')}:
                </Text>
                <View style={styles.sessionsContainer}>
                  {item.leaveDates.map((date, index) => (
                    <Text key={index} style={[styles.sessionText, { color: theme.colors.text.primary }]}>
                      {formatDate(date.date)} ({date.session})
                    </Text>
                  ))}
                </View>
              </View>
            )}
            
            {isPending && (
              <Button
                title={t('leave.cancelRequest', 'Cancel Request')}
                onPress={() => handleCancelRequest(item.id)}
                variant="outline"
                size="small"
                icon="close-circle-outline"
                style={styles.cancelButton}
              />
            )}
            
            {/* Add View Details button */}
            <Button
              title={t('leave.viewDetails', 'View Details')}
              onPress={() => router.push(`/modules/leave/LeaveDetail?id=${item.id}`)}
              variant="primary"
              size="small"
              icon="document-text-outline"
              style={styles.viewDetailsButton}
            />
          </View>
        )}
      </Card>
    );
  };

  // Render filter buttons
  const renderFilterButtons = () => {
    const filters = [
      { id: null, label: t('leave.all', 'All') },
      { id: 'P', label: t('leave.pending', 'Pending') },
      { id: 'A', label: t('leave.approved', 'Approved') },
      { id: 'R', label: t('leave.rejected', 'Rejected') },
      { id: 'L', label: t('leave.cancelled', 'Cancelled') },
    ];
    
    return (
      <View style={styles.filterContainer}>
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter.id || 'all'}
            style={[
              styles.filterButton,
              statusFilter === filter.id && { 
                backgroundColor: theme.colors.primary + '20',
                borderColor: theme.colors.primary,
              }
            ]}
            onPress={() => changeStatusFilter(filter.id)}
          >
            <Text
              style={[
                styles.filterText,
                { color: statusFilter === filter.id ? theme.colors.primary : theme.colors.text.secondary }
              ]}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };
  
  // Add these state variables at the top with other state declarations
  const [yearPickerVisible, setYearPickerVisible] = useState(false);
  const [currentDecade, setCurrentDecade] = useState(Math.floor(new Date().getFullYear() / 10) * 10);
  
  // Add decade navigation functions
  const goToPreviousDecade = useCallback(() => {
    setCurrentDecade(prev => prev - 10);
  }, []);
  
  const goToNextDecade = useCallback(() => {
    setCurrentDecade(prev => prev + 10);
  }, []);
  
  // Modify the renderYearSelector function
  const renderYearSelector = () => {
    return (
      <View style={styles.yearSelectorContainer}>
        <TouchableOpacity 
          style={styles.yearNavigationButton}
          onPress={() => changeYear(selectedYear - 1)}
        >
          <Ionicons 
            name="chevron-back" 
            size={24} 
            color={theme.colors.primary} 
          />
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={() => setYearPickerVisible(true)}
          style={{
            ...styles.yearButton,
            backgroundColor: theme.colors.background.secondary || '#e8e8e8',
            borderColor: 'rgba(0,0,0,0.1)'
          }}
        >
          <Text style={{
            ...styles.yearButtonText,
            color: theme.colors.text.primary
          }}>
            {selectedYear.toString()}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.yearNavigationButton}
          onPress={() => changeYear(selectedYear + 1)}
        >
          <Ionicons 
            name="chevron-forward" 
            size={24} 
            color={theme.colors.primary} 
          />
        </TouchableOpacity>
      </View>
    );
  };

  // Add the return statement for the component
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

    <YearPickerModal
        visible={yearPickerVisible}
        onClose={() => setYearPickerVisible(false)}
        onSelectYear={(year) => {
          changeYear(year);
          setYearPickerVisible(false);
        }}
        selectedYear={selectedYear}
        minYear={2000}
        maxYear={new Date().getFullYear() + 1}
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
        {t('leave.viewApplications', 'View Leave Applications')}
      </Text>
    </View>

    {loading && !refreshing ? (
      <View style={styles.loadingContainer}>
        <LoadingIndicator 
          size={60}
          duration={600}
          showText={true}
        />
      </View>
    ) : (
      <View style={styles.content}>
        {renderYearSelector()}
        {renderFilterButtons()}
        
        <FlatList
          data={filteredHistory}
          renderItem={renderLeaveItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Ionicons 
                name="calendar-outline" 
                size={60} 
                color={theme.colors.text.secondary} 
              />
              <Text style={[styles.emptyTitle, { color: theme.colors.text.primary }]}>
                {t('leave.noLeaveApplications', 'No Leave Applications')}
              </Text>
              <Text style={[styles.emptySubtitle, { color: theme.colors.text.secondary }]}>
                {t('leave.noLeaveApplicationsDesc', 'You have not applied for any leave during this period.')}
              </Text>
              <Button
                title={t('leave.applyLeave', 'Apply for Leave')}
                onPress={() => router.push('/modules/leave/applyLeave' as any)}
                variant="primary"
                size="medium"
                icon="add-circle-outline"
                style={styles.applyButton}
              />
            </View>
          )}
        />
      </View>
    )}
  </View>
);
}

// Add these styles to the StyleSheet
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
  padding: 8,
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
content: {
  flex: 1,
  paddingHorizontal: 16,
},
yearSelectorContainer: {
  flexDirection: 'row',
  justifyContent: 'center',
  alignItems: 'center',
  paddingVertical: 16,
  paddingHorizontal: 16,
  marginBottom: 8,
},
yearNavigationButton: {
  padding: 10,
  borderRadius: 20,
  backgroundColor: 'rgba(0,0,0,0.03)',
},
yearInputContainer: {
  marginBottom: 0,
  width: 120,
  marginHorizontal: 16,
  borderRadius: 20,
  overflow: 'hidden',
  elevation: 2,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.1,
  shadowRadius: 2,
  backgroundColor: 'transparent',
  borderWidth: 0,
},
yearInput: {
  fontSize: 18,
  fontWeight: '600',
  textAlign: 'center',
  paddingVertical: 10,
  paddingHorizontal: 0,
},
yearButton: {
  marginHorizontal: 16,
  minWidth: 120,
  borderRadius: 20,
  elevation: 1,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.1,
  shadowRadius: 2,
  paddingHorizontal: 30,
  paddingVertical: 8,
  borderWidth: 1,
},
yearButtonText: {
  fontSize: 18,
  fontWeight: '600',
},
filterContainer: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  marginBottom: 16,
},
filterButton: {
  paddingHorizontal: 5,
  paddingVertical: 6,
  borderRadius: 16,
  borderWidth: 1,
  borderColor: '#E0E0E0',
  flex: 1,
  marginHorizontal: 2,
  alignItems: 'center',
  justifyContent: 'center',
},
filterText: {
  fontSize: 11,
  fontWeight: '500',
  textAlign: 'center',
},
listContainer: {
  paddingBottom: 20,
},
leaveCard: {
  marginBottom: 12,
  padding: 16,
},
leaveHeader: {
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
statusTag: {
  paddingHorizontal: 8,
  paddingVertical: 4,
  borderRadius: 12,
},
statusText: {
  fontSize: 12,
  fontWeight: '600',
},
leaveDates: {
  flexDirection: 'row',
  alignItems: 'center',
  flexWrap: 'wrap',
},
dateContainer: {
  marginRight: 16,
  marginBottom: 4,
},
dateLabel: {
  fontSize: 12,
  marginBottom: 2,
},
dateValue: {
  fontSize: 14,
  fontWeight: '500',
},
daysContainer: {
  marginLeft: 'auto',
},
daysValue: {
  fontSize: 14,
  fontWeight: '600',
},
expandedDetails: {
  marginTop: 8,
},
divider: {
  height: 1,
  backgroundColor: '#E0E0E0',
  marginVertical: 8,
},
detailRow: {
  marginBottom: 8,
},
detailLabel: {
  fontSize: 12,
  marginBottom: 2,
},
detailValue: {
  fontSize: 14,
},
sessionsContainer: {
  marginTop: 4,
},
sessionText: {
  fontSize: 13,
  marginBottom: 2,
},
cancelButton: {
  marginTop: 12,
},
viewDetailsButton: {
  marginTop: 12,
},
emptyContainer: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  paddingHorizontal: 32,
  paddingVertical: 60,
},
emptyTitle: {
  fontSize: 18,
  fontWeight: 'bold',
  marginTop: 16,
  marginBottom: 8,
  textAlign: 'center',
},
emptySubtitle: {
  fontSize: 14,
  textAlign: 'center',
  marginBottom: 24,
},
applyButton: {
  minWidth: 180,
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
  borderRadius: 12,
  padding: 20,
  elevation: 5,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.25,
  shadowRadius: 3.84,
},
confirmAlertTitle: {
  fontSize: 18,
  fontWeight: 'bold',
  marginTop: 16,
  marginBottom: 8,
  textAlign: 'center',
},
confirmAlertMessage: {
  fontSize: 14,
  textAlign: 'center',
  marginBottom: 24,
},
confirmAlertButtons: {
  flexDirection: 'row',
  justifyContent: 'space-around',
},
confirmAlertButton: {
  minWidth: 100,
},
modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  yearPickerModal: {
    width: '80%',
    maxWidth: 320,
    borderRadius: 12,
    padding: 16,
    elevation: 5,
  },
  yearPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  yearPickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  calendarYearContainer: {
    marginVertical: 8,
  },
  decadeNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  decadeNavButton: {
    padding: 8,
  },
  decadeTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  yearGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  yearGridItem: {
    width: '25%',
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  yearGridText: {
    fontSize: 16,
  },
  yearOutOfRange: {
    opacity: 0.5,
  },
  yearSelected: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
});
