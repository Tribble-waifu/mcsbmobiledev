import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  SafeAreaView,
  RefreshControl,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

// Import components
import Card from '../../components/Card';
import Button from '../../components/Button';
import InputField from '../../components/InputField';
import AlertMessage from '../../components/AlertMessage';
import LoadingIndicator from '../../components/LoadingIndicator';
import CustomAlert from '../../components/CustomAlert';

// Import API and storage utilities
import { fetchPayslips, Payslip } from '../../api/payslipApi';
import { 
  savePayslipsForYear, 
  getPayslipsForYear, 
  shouldRefreshPayslips 
} from '../../utils/payslipStorage';

// Import theme
import useTheme from '../../themes/useTheme';

const PayslipListing: React.FC = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  
  // State variables
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [isEditingYear, setIsEditingYear] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<'success' | 'error' | 'warning' | 'info'>('info');
  const [customAlertVisible, setCustomAlertVisible] = useState(false);
  const [customAlertMessage, setCustomAlertMessage] = useState('');
  
  // Available years for selection (current year and 5 years back)
  const currentYear = new Date().getFullYear();
  const availableYears = Array.from({ length: 6 }, (_, i) => (currentYear - i).toString());

  // Load payslips when component mounts or year changes
  useEffect(() => {
    loadPayslips();
  }, [selectedYear]);

  // Function to load payslips from storage or API
  const loadPayslips = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try to get payslips from storage first
      const storedPayslips = await getPayslipsForYear(selectedYear);
      const needsRefresh = await shouldRefreshPayslips(selectedYear);
      
      
      if (storedPayslips && !needsRefresh) {
        // Use cached data if available and not expired
        setPayslips(storedPayslips);
        setLoading(false);
        return;
      }
      
      // Fetch from API if no cached data or needs refresh
      const response = await fetchPayslips(selectedYear);
      
      
      if (response.success) {
        setPayslips(response.data);
        // Save to storage for future use
        await savePayslipsForYear(selectedYear, response.data);
      } else {
        console.error(`[PayslipListing] API fetch failed: ${response.message}`);
        setError(response.message);
        // If API fails but we have cached data, use it as fallback
        if (storedPayslips) {
          setPayslips(storedPayslips);
          setAlertType('warning');
          setAlertMessage(t('payslip.usingCachedData', 'Using cached data. Pull down to refresh.'));
          setAlertVisible(true);
        }
      }
    } catch (err) {
      console.error('[PayslipListing] Error loading payslips:', err);
      console.error('[PayslipListing] Error details:', JSON.stringify(err, Object.getOwnPropertyNames(err)));
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedYear, t]);

  // Handle refresh when pull-to-refresh is triggered
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadPayslips();
  }, [loadPayslips]);

  // Navigate to previous year
  const goToPreviousYear = useCallback(() => {
    const currentIndex = availableYears.indexOf(selectedYear);
    if (currentIndex < availableYears.length - 1) {
      setSelectedYear(availableYears[currentIndex + 1]);
    }
  }, [selectedYear, availableYears]);

  // Navigate to next year
  const goToNextYear = useCallback(() => {
    const currentIndex = availableYears.indexOf(selectedYear);
    if (currentIndex > 0) {
      setSelectedYear(availableYears[currentIndex - 1]);
    }
  }, [selectedYear, availableYears]);

  // Handle year input change
  const handleYearChange = useCallback((text: string) => {
    // Only allow numeric input
    const numericInput = text.replace(/[^0-9]/g, '');
    
    // Limit to 4 digits
    if (numericInput.length <= 4) {
      setSelectedYear(numericInput);
    }
  }, []);

  // Handle year input submission
  const handleYearSubmit = useCallback(() => {
    // Validate the year is within available range
    const year = parseInt(selectedYear);
    const minYear = Math.min(...availableYears.map(y => parseInt(y)));
    const maxYear = Math.max(...availableYears.map(y => parseInt(y)));
    
    if (isNaN(year) || year < minYear || year > maxYear || selectedYear.length !== 4) {
      // Reset to current year if invalid
      setSelectedYear(new Date().getFullYear().toString());
    }
  }, [selectedYear, availableYears]);

  // Format date for display (e.g., "31 Oct 2023")
  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }, []);

  // Navigate to payslip detail view
  const viewPayslip = useCallback((payslip: Payslip) => {
    // Extract date part from the full datetime string
    const datePart = payslip.payrollDate.split('T')[0];
    
    router.push({
      pathname: '/modules/payslip/payslipViewer',
      params: {
        payrollType: payslip.payrollType,
        payrollDate: datePart,
        fileName: payslip.fileName
      }
    });
  }, []);

  // Show custom alert with payslip details
  const showPayslipDetails = useCallback((payslip: Payslip) => {
    setCustomAlertMessage(
      `${t('payslip.payslipDetails', 'Payslip Details')}:\n\n` +
      `${t('payslip.date', 'Date')}: ${formatDate(payslip.payrollDate)}\n` +
      `${t('payslip.type', 'Type')}: ${payslip.payrollTypeDescription}\n` +
      `${t('payslip.file', 'File')}: ${payslip.fileName}`
    );
    setCustomAlertVisible(true);
  }, [formatDate, t]);

  // Render each payslip item
  const renderPayslipItem = useCallback(({ item }: { item: Payslip }) => (
    <Card 
      style={styles.payslipCard}
      elevation={2}
      borderRadius={8}
      backgroundColor={theme.colors.card.background}
    >
      <View style={styles.payslipContent}>
        <View style={styles.payslipInfo}>
          <Text style={[styles.payslipDate, { color: theme.colors.text.primary }]}>
            {formatDate(item.payrollDate)}
          </Text>
          <Text style={[styles.payslipType, { color: theme.colors.text.secondary }]}>
            {item.payrollTypeDescription}
          </Text>
        </View>
        <View style={styles.payslipActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => showPayslipDetails(item)}
          >
            <Ionicons 
              name="information-circle-outline" 
              size={24} 
              color={theme.colors.primary} 
            />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => viewPayslip(item)}
          >
            <Ionicons 
              name="document-text-outline" 
              size={24} 
              color={theme.colors.primary} 
            />
          </TouchableOpacity>
        </View>
      </View>
    </Card>
  ), [formatDate, showPayslipDetails, viewPayslip, theme]);

  // Render empty state
  const renderEmptyState = useCallback(() => (
    <View style={styles.emptyContainer}>
      <Ionicons 
        name="document-outline" 
        size={80} 
        color={theme.colors.text.secondary} 
      />
      <Text style={[styles.emptyText, { color: theme.colors.text.secondary }]}>
        {t('payslip.noPayslips', 'No payslips found for this year')}
      </Text>
      <Button
        title={t('common.refresh', 'Refresh')}
        onPress={loadPayslips}
        variant="primary"
        size="medium"
        icon="refresh-outline"
        style={styles.refreshButton}
      />
    </View>
  ), [loadPayslips, t, theme]);

  // Render error state
  const renderErrorState = useCallback(() => (
    <View style={styles.errorContainer}>
      <Ionicons 
        name="alert-circle-outline" 
        size={80} 
        color={theme.colors.status.error} 
      />
      <Text style={[styles.errorText, { color: theme.colors.text.primary }]}>
        {error || t('common.errorOccurred', 'An error occurred')}
      </Text>
      <Button
        title={t('common.retry', 'Retry')}
        onPress={loadPayslips}
        variant="primary"
        size="medium"
        icon="refresh-outline"
        style={styles.retryButton}
      />
    </View>
  ), [error, loadPayslips, t, theme]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      {/* Alert Messages */}
      <AlertMessage
        visible={alertVisible}
        type={alertType}
        message={alertMessage}
        onClose={() => setAlertVisible(false)}
      />
      
      <CustomAlert
        visible={customAlertVisible}
        type="info"
        message={customAlertMessage}
        onClose={() => setCustomAlertVisible(false)}
      />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text.primary }]}>
          {t('payslip.myPayslips', 'My Payslips')}
        </Text>
      </View>
      
      {/* Year Selector */}
      <View style={styles.yearSelectorContainer}>
        <TouchableOpacity 
          style={[
            styles.yearNavigationButton, 
            { opacity: availableYears.indexOf(selectedYear) < availableYears.length - 1 ? 1 : 0.5 }
          ]}
          onPress={goToPreviousYear}
          disabled={availableYears.indexOf(selectedYear) >= availableYears.length - 1}
        >
          <Ionicons 
            name="chevron-back" 
            size={24} 
            color={theme.colors.primary} 
          />
        </TouchableOpacity>
        
        {isEditingYear ? (
          <InputField
            value={selectedYear}
            onChangeText={handleYearChange}
            onBlur={() => {
              handleYearSubmit();
              setIsEditingYear(false);
            }}
            onSubmitEditing={() => {
              handleYearSubmit();
              setIsEditingYear(false);
            }}
            keyboardType="numeric"
            maxLength={4}
            textAlign="center"
            containerStyle={styles.yearInputContainer}
            inputStyle={[styles.yearInput, { color: theme.colors.text.primary }]}
            style={{ 
              backgroundColor: theme.colors.card.background, 
              borderRadius: 20,
              borderWidth: 0
            }}
            label=""
            autoFocus={true}
          />
        ) : (
          <Button
            title={selectedYear}
            onPress={() => setIsEditingYear(true)}
            variant="outline"
            size="medium"
            style={{
              ...styles.yearButton,
              backgroundColor: theme.colors.background.secondary || '#e8e8e8',
              borderColor: 'rgba(0,0,0,0.1)'
            }}
            textStyle={{
              ...styles.yearButtonText,
              color: theme.colors.text.primary
            }}
          />
        )}
        
        <TouchableOpacity 
          style={[
            styles.yearNavigationButton, 
            { opacity: availableYears.indexOf(selectedYear) > 0 ? 1 : 0.5 }
          ]}
          onPress={goToNextYear}
          disabled={availableYears.indexOf(selectedYear) <= 0}
        >
          <Ionicons 
            name="chevron-forward" 
            size={24} 
            color={theme.colors.primary} 
          />
        </TouchableOpacity>
      </View>
      
      {/* Content */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <LoadingIndicator size={80} showText={true} />
        </View>
      ) : error && payslips.length === 0 ? (
        renderErrorState()
      ) : (
        <FlatList
          data={payslips}
          renderItem={renderPayslipItem}
          keyExtractor={(item) => `${item.payrollType}_${item.payrollDate}`}
          contentContainerStyle={[
            styles.listContainer,
            payslips.length === 0 && styles.emptyListContainer
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
          ListEmptyComponent={renderEmptyState}
        />
      )}
    </SafeAreaView>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
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
  yearDisplay: {
    paddingHorizontal: 30,
    paddingVertical: 10,
    borderRadius: 20,
    marginHorizontal: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
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
  yearText: {
    fontSize: 18,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 16,
    paddingTop: 8,
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  payslipCard: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  payslipContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  payslipInfo: {
    flex: 1,
  },
  payslipDate: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
  },
  payslipType: {
    fontSize: 14,
  },
  payslipActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 10,
    marginLeft: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  refreshButton: {
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    marginTop: 16,
  },
});

export default PayslipListing;