import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Linking } from 'react-native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import useTheme from '../../themes/useTheme';
import { getNBDetail } from '../../api/noticeboardApi';
import { getNBDetailFromStorage, saveNBDetail, isNBDetailStale } from '../../utils/nbStorage';
import Card from '../../components/Card';
import AlertMessage from '../../components/AlertMessage';
import { NoticeboardDetailItem, NoticeboardAttachment } from '../../api/noticeboardApi';
import { getBaseUrl } from '../../utils/authStorage';

export default function NBDetail() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { id } = useLocalSearchParams();
  const [noticeDetail, setNoticeDetail] = useState<NoticeboardDetailItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<'success' | 'error' | 'warning' | 'info'>('info');
  const [baseUrl, setBaseUrl] = useState<string>('');

  // Function to fetch notice detail
  const fetchNoticeDetail = async (forceRefresh = false) => {
    if (!id) {
      setError('Notice ID is missing');
      setLoading(false);
      return;
    }

    // Convert id to string if it's an array
    const noticeId = Array.isArray(id) ? id[0] : id;

    try {
      setLoading(true);
      
      // Get base URL for attachments
      const apiBaseUrl = await getBaseUrl();
      setBaseUrl(apiBaseUrl || '');

      // Check if we have cached data and it's not stale
      if (!forceRefresh) {
        const isStale = await isNBDetailStale(noticeId);
        if (!isStale) {
          const cachedData = await getNBDetailFromStorage(noticeId);
          if (cachedData) {
            setNoticeDetail(cachedData);
            setError(null);
            setLoading(false);
            return;
          }
        }
      }
      
      // If no cached data or forced refresh, fetch from API
      const response = await getNBDetail(noticeId);
      
      if (response.success && response.data) {
        setNoticeDetail(response.data);
        setError(null);
        
        // Save to local storage
        await saveNBDetail(noticeId, response.data);
      } else {
        setError(response.message || 'Failed to fetch notice details');
        setAlertType('error');
        setAlertMessage(response.message || 'Failed to fetch notice details');
        setAlertVisible(true);
        
        // Try to load from cache as fallback
        const cachedData = await getNBDetailFromStorage(noticeId);
        if (cachedData) {
          setNoticeDetail(cachedData);
          setAlertType('warning');
          setAlertMessage('Showing cached data. Please try again later.');
          setAlertVisible(true);
        }
      }
    } catch (err) {
      console.error('Error in fetchNoticeDetail:', err);
      setError('An unexpected error occurred');
      setAlertType('error');
      setAlertMessage('An unexpected error occurred');
      setAlertVisible(true);
      
      // Try to load from cache as fallback
      const cachedData = await getNBDetailFromStorage(Array.isArray(id) ? id[0] : id);
      if (cachedData) {
        setNoticeDetail(cachedData);
        setAlertType('warning');
        setAlertMessage('Showing cached data. Please try again later.');
        setAlertVisible(true);
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchNoticeDetail();
  }, [id]);

  // Format date to a more readable format
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Handle opening attachments
  const handleOpenAttachment = async (attachment: NoticeboardAttachment) => {
    try {
      if (!noticeDetail) {
        throw new Error('Notice details not available');
      }
      
      // Navigate to the attachment viewer screen
      router.push({
        pathname: '/modules/noticeboard/nbAttachment',
        params: { 
          noticeId: noticeDetail.id.toString(),
          attachmentId: attachment.id.toString(),
          fileName: attachment.fileName,
          mimeType: attachment.mimeType
        }
      });
    } catch (error) {
      console.error('Error navigating to attachment:', error);
      setAlertType('error');
      setAlertMessage('Failed to open attachment');
      setAlertVisible(true);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      <Stack.Screen 
        options={{
          title: t('noticeboard.detailTitle', 'Notice Detail'),
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
          headerShown: true,
        }}
      />

      <AlertMessage
        visible={alertVisible}
        type={alertType}
        message={alertMessage}
        onClose={() => setAlertVisible(false)}
      />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.text.secondary }]}>
            {t('common.loading', 'Loading...')}
          </Text>
        </View>
      ) : error && !noticeDetail ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={60} color={theme.colors.text.secondary} />
          <Text style={[styles.errorText, { color: theme.colors.text.secondary }]}>
            {error}
          </Text>
          <TouchableOpacity 
            style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => fetchNoticeDetail(true)}
          >
            <Text style={[styles.retryButtonText, { color: theme.colors.background.primary }]}>
              {t('common.retry', 'Retry')}
            </Text>
          </TouchableOpacity>
        </View>
      ) : noticeDetail ? (
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <Card 
            style={styles.noticeCard}
            elevation={2}
            borderRadius={12}
          >
            <View style={styles.noticeHeader}>
              {noticeDetail.importantNotice && (
                <View style={[styles.importantBadge, { backgroundColor: theme.colors.accent + '20' }]}>
                  <Ionicons name="alert-circle" size={16} color={theme.colors.accent} />
                  <Text style={[styles.importantText, { color: theme.colors.accent }]}>
                    {t('noticeboard.important', 'Important')}
                  </Text>
                </View>
              )}
              <Text style={[styles.noticeTitle, { color: theme.colors.text.primary }]}>
                {noticeDetail.noticeTitle}
              </Text>
              <Text style={[styles.noticeDate, { color: theme.colors.text.secondary }]}>
                {formatDate(noticeDetail.effectiveDateFrom)}
              </Text>
            </View>
            
            <View style={styles.divider} />
            
            <Text style={[styles.noticeContent, { color: theme.colors.text.primary }]}>
              {noticeDetail.message}
            </Text>
            
            {noticeDetail.attachments && noticeDetail.attachments.length > 0 && (
              <View style={styles.attachmentsContainer}>
                <Text style={[styles.attachmentsTitle, { color: theme.colors.text.primary }]}>
                  {t('noticeboard.attachments', 'Attachments')}
                </Text>
                
                {noticeDetail.attachments.map((attachment, index) => (
                  <TouchableOpacity 
                    key={attachment.id} 
                    style={[
                      styles.attachmentItem,
                      { borderBottomColor: theme.colors.border.light },
                      index === noticeDetail.attachments!.length - 1 && { borderBottomWidth: 0 }
                    ]}
                    onPress={() => handleOpenAttachment(attachment)}
                  >
                    <Ionicons 
                      name={attachment.mimeType.includes('pdf') ? 'document-text' : 'document'} 
                      size={24} 
                      color={theme.colors.primary} 
                    />
                    <Text 
                      style={[styles.attachmentName, { color: theme.colors.text.primary }]}
                      numberOfLines={1}
                      ellipsizeMode="middle"
                    >
                      {attachment.fileName}
                    </Text>
                    <Ionicons name="download-outline" size={20} color={theme.colors.primary} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </Card>
        </ScrollView>
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-text-outline" size={60} color={theme.colors.text.secondary} />
          <Text style={[styles.emptyText, { color: theme.colors.text.secondary }]}>
            {t('noticeboard.noticeNotFound', 'Notice not found')}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
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
  noticeCard: {
    padding: 16,
  },
  noticeHeader: {
    marginBottom: 16,
  },
  importantBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 8,
  },
  importantText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  noticeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  noticeDate: {
    fontSize: 14,
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 16,
  },
  noticeContent: {
    fontSize: 16,
    lineHeight: 24,
  },
  attachmentsContainer: {
    marginTop: 24,
  },
  attachmentsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  attachmentName: {
    flex: 1,
    fontSize: 14,
    marginHorizontal: 12,
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
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
  },
});