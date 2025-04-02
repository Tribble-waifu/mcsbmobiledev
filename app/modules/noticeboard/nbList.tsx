import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import useTheme from '../../themes/useTheme';
import { getNBList } from '../../api/noticeboardApi';
import { getNBListFromStorage, saveNBList, isNBListStale } from '../../utils/nbStorage';
import Card from '../../components/Card';
import AlertMessage from '../../components/AlertMessage';
import { NoticeboardItem } from '../../api/noticeboardApi';

export default function NBList() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [noticeboardItems, setNoticeboardItems] = useState<NoticeboardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<'success' | 'error' | 'warning' | 'info'>('info');

  // Function to fetch noticeboard items
  const fetchNoticeboardItems = async (forceRefresh = false) => {
    try {
      setLoading(true);
      
      // Check if we have cached data and it's not stale
      if (!forceRefresh) {
        const isStale = await isNBListStale();
        if (!isStale) {
          const cachedData = await getNBListFromStorage();
          if (cachedData && cachedData.length > 0) {
            setNoticeboardItems(cachedData);
            setError(null);
            setLoading(false);
            setRefreshing(false);
            return;
          }
        }
      }
      
      // If no cached data or forced refresh, fetch from API
      const response = await getNBList();
      
      if (response.success) {
        const noticeData = response.data as unknown as NoticeboardItem[];
        setNoticeboardItems(noticeData);
        setError(null);
        
        // Save to local storage
        await saveNBList(noticeData);
      } else {
        setError(response.message || 'Failed to fetch noticeboard items');
        setAlertType('error');
        setAlertMessage(response.message || 'Failed to fetch noticeboard items');
        setAlertVisible(true);
        
        // Try to load from cache as fallback
        const cachedData = await getNBListFromStorage();
        if (cachedData && cachedData.length > 0) {
          setNoticeboardItems(cachedData);
          setAlertType('warning');
          setAlertMessage('Showing cached data. Pull down to try refreshing again.');
          setAlertVisible(true);
        }
      }
    } catch (err) {
      console.error('Error in fetchNoticeboardItems:', err);
      setError('An unexpected error occurred');
      setAlertType('error');
      setAlertMessage('An unexpected error occurred');
      setAlertVisible(true);
      
      // Try to load from cache as fallback
      const cachedData = await getNBListFromStorage();
      if (cachedData && cachedData.length > 0) {
        setNoticeboardItems(cachedData);
        setAlertType('warning');
        setAlertMessage('Showing cached data. Pull down to try refreshing again.');
        setAlertVisible(true);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchNoticeboardItems();
  }, []);

  // Handle pull-to-refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchNoticeboardItems(true); // Force refresh from API
  };

  // Format date to a more readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Navigate to notice detail page
  const handleNoticePress = (item: NoticeboardItem) => {
    router.push({
      pathname: '/modules/noticeboard/nbDetail',
      params: { id: item.id.toString() }
    });
  };

  // Render each noticeboard item
  const renderNoticeItem = ({ item }: { item: NoticeboardItem }) => (
    <TouchableOpacity onPress={() => handleNoticePress(item)}>
      <Card 
        style={[
          styles.noticeCard, 
          item.importantNotice && styles.importantNotice
        ]}
        elevation={2}
        borderRadius={12}
      >
        <View style={styles.noticeHeader}>
          <View style={styles.titleContainer}>
            {item.importantNotice && (
              <Ionicons 
                name="alert-circle" 
                size={20} 
                color={theme.colors.accent} 
                style={styles.importantIcon} 
              />
            )}
            <Text 
              style={[
                styles.noticeTitle, 
                { color: theme.colors.text.primary }
              ]}
              numberOfLines={2}
            >
              {item.noticeTitle}
            </Text>
          </View>
          {item.hasAttachment && (
            <Ionicons name="attach" size={20} color={theme.colors.text.secondary} />
          )}
        </View>
        
        <Text 
          style={[styles.noticePreview, { color: theme.colors.text.secondary }]}
          numberOfLines={2}
        >
          {item.message}
        </Text>
        
        <View style={styles.noticeFooter}>
          <Text style={[styles.noticeDate, { color: theme.colors.text.secondary }]}>
            {formatDate(item.effectiveDateFrom)}
          </Text>
          <Ionicons name="chevron-forward" size={16} color={theme.colors.text.secondary} />
        </View>
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      <Stack.Screen 
        options={{
          title: t('noticeboard.title', 'Noticeboard'),
          headerTitleStyle: { 
            color: theme.colors.text.primary,
            fontSize: 18,
            fontWeight: 'bold',
          },
          headerStyle: { 
            backgroundColor: theme.colors.background.primary,
          },
          headerShadowVisible: true,
          headerTintColor: theme.colors.primary,
          headerShown: true, // Explicitly show the header
        }}
      />

      <AlertMessage
        visible={alertVisible}
        type={alertType}
        message={alertMessage}
        onClose={() => setAlertVisible(false)}
      />

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.text.secondary }]}>
            {t('common.loading', 'Loading...')}
          </Text>
        </View>
      ) : error && noticeboardItems.length === 0 ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={60} color={theme.colors.text.secondary} />
          <Text style={[styles.errorText, { color: theme.colors.text.secondary }]}>
            {error}
          </Text>
          <TouchableOpacity 
            style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => fetchNoticeboardItems(true)}
          >
            <Text style={[styles.retryButtonText, { color: theme.colors.primary }]}>
              {t('common.retry', 'Retry')}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={noticeboardItems}
          renderItem={renderNoticeItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="notifications-off-outline" size={60} color={theme.colors.text.secondary} />
              <Text style={[styles.emptyText, { color: theme.colors.text.secondary }]}>
                {t('noticeboard.noNotices', 'No notices available')}
              </Text>
            </View>
          }
        />
      )}
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
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  listContainer: {
    padding: 16,
  },
  noticeCard: {
    padding: 16,
    marginBottom: 12,
  },
  importantNotice: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF5722',
  },
  noticeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  importantIcon: {
    marginRight: 6,
  },
  noticeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  noticePreview: {
    fontSize: 14,
    marginBottom: 12,
  },
  noticeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  noticeDate: {
    fontSize: 12,
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
    marginTop: 10,
    marginBottom: 20,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 50,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
  },
});