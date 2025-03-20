import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { BarCodeScanner } from 'expo-barcode-scanner';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { useTranslation } from 'react-i18next';
import useTheme from '../themes/useTheme';

import Card from '../components/Card';
import Button from '../components/Button';
import AlertMessage from '../components/AlertMessage';
import { saveScannedQRData, saveBaseUrl, getScannedQRData, getBaseUrl } from '../utils/authStorage';

// Import i18n configuration
import '../locales/i18n';

export default function ScanQR() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [scannedData, setScannedData] = useState('');
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<'success' | 'error' | 'warning' | 'info'>('info');

  // Camera permissions code and load saved data
  useEffect(() => {
    const getCameraPermissions = async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
      
      if (status !== 'granted') {
        setAlertType('error');
        setAlertMessage(t('scanQR.cameraPermissionRequired'));
        setAlertVisible(true);
      }
    };

    // Add this function to load saved QR data
    const loadSavedData = async () => {
      try {
        const savedQRData = await getScannedQRData();
        const savedBaseUrl = await getBaseUrl();
        
        if (savedQRData) {
          setScannedData(savedQRData);
          setScanned(true); // Set to true to show the scanned view instead of camera
          console.log('Loaded saved QR data:', savedQRData);
        }
        
        if (savedBaseUrl) {
          console.log('Loaded saved base URL:', savedBaseUrl);
        }
      } catch (error) {
        console.error('Error loading saved data:', error);
      }
    };

    getCameraPermissions();
    loadSavedData(); // Call the function to load saved data
  }, [t]);

  // Handle barcode scanning
  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    if (scanned) return;
    
    setScanned(true);
    setScannedData(data);
    
    try {
      // Save both the scanned data and use it as base URL
      await saveScannedQRData(data);
      await saveBaseUrl(data);
      setAlertType('success');
      setAlertMessage(t('scanQR.qrCodeScannedSuccess'));
    } catch (error) {
      console.error('Error saving scanned data:', error);
      setAlertType('warning');
      setAlertMessage(t('scanQR.qrCodeScannedFailed'));
    }
    
    setAlertVisible(true);
  };

  const handleScanAgain = () => {
    setScanned(false);
  };

  const handleBackToLogin = () => {
    router.replace('/auth/Login');
  };

  // Keep only one version of handleChooseFromGallery
  const handleChooseFromGallery = async () => {
    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      setAlertType('error');
      setAlertMessage(t('scanQR.galleryPermissionRequired'));
      setAlertVisible(true);
      return;
    }
    
    try {
      // Pick image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false, // Set to false to avoid cropping which might cut off the QR code
        quality: 1,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0];
        
        try {
          // Scan QR code from image
          const scannedCodes = await BarCodeScanner.scanFromURLAsync(
            selectedImage.uri,
            [BarCodeScanner.Constants.BarCodeType.qr]
          );
          
          if (scannedCodes.length > 0) {
            // QR code found in the image
            const qrData = scannedCodes[0].data;
            setScanned(true);
            setScannedData(qrData);
            
            try {
              // Save both the scanned data and use it as base URL
              await saveScannedQRData(qrData);
              await saveBaseUrl(qrData);
              setAlertType('success');
              setAlertMessage(t('scanQR.qrCodeDetected'));
            } catch (saveError) {
              console.error('Error saving QR data:', saveError);
              setAlertType('warning');
              setAlertMessage(t('scanQR.qrCodeDetectedFailed'));
            }
            
            setAlertVisible(true);
          } else {
            // No QR code found in the image
            setAlertType('warning');
            setAlertMessage(t('scanQR.noQRCodeFound'));
            setAlertVisible(true);
          }
        } catch (scanError) {
          console.error('Error scanning QR code from image:', scanError);
          setAlertType('error');
          setAlertMessage(t('scanQR.failedToScanQR'));
          setAlertVisible(true);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      setAlertType('error');
      setAlertMessage(t('scanQR.failedToPickImage'));
      setAlertVisible(true);
    }
  };

  if (hasPermission === null) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.text, { color: theme.colors.text.primary }]}>
            {t('scanQR.requestingPermission')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
        <View style={styles.errorContainer}>
          <Ionicons name="camera-outline" size={60} color={theme.colors.accent} />
          <Text style={[styles.errorText, { color: theme.colors.text.primary }]}>
            {t('scanQR.cameraAccessDenied')}
          </Text>
          <Text style={[styles.subText, { color: theme.colors.text.secondary }]}>
            {t('scanQR.cameraPermissionRequired')}
          </Text>
          <Button 
            title={t('scanQR.backToLogin')}
            onPress={handleBackToLogin}
            style={styles.button}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      <AlertMessage
        visible={alertVisible}
        type={alertType}
        message={alertMessage}
        onClose={() => setAlertVisible(false)}
      />
      
      {/* Updated header with improved back button */}
      <View style={[styles.customHeader, { backgroundColor: theme.colors.background.primary }]}>
        <TouchableOpacity 
          onPress={handleBackToLogin} 
          style={[styles.backButton, { backgroundColor: theme.colors.primary + '20' }]}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>
          {t('scanQR.title')}
        </Text>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.content}>
        <Card elevation={4} style={styles.scannerCard}>
          {!scanned ? (
            <View style={styles.scannerWrapper}>
              <BarCodeScanner
                onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
                style={StyleSheet.absoluteFillObject}
                barCodeTypes={[BarCodeScanner.Constants.BarCodeType.qr]}
              />
              <View style={styles.overlay}>
                <View style={styles.scanArea}>
                  <View style={[styles.cornerTL, styles.corner]} />
                  <View style={[styles.cornerTR, styles.corner]} />
                  <View style={[styles.cornerBL, styles.corner]} />
                  <View style={[styles.cornerBR, styles.corner]} />
                </View>
              </View>
            </View>
          ) : (
            <View style={[styles.scannedContainer, { backgroundColor: theme.colors.card.background }]}>
              <Ionicons name="checkmark-circle" size={60} color={theme.colors.status.success} />
              <Text style={[styles.scannedText, { color: theme.colors.text.primary }]}>
                {t('scanQR.qrCodeScanned')}
              </Text>
              <Button 
                title={t('scanQR.scanAgain')}
                onPress={handleScanAgain}
                style={styles.button}
                variant="outline"
              />
            </View>
          )}
        </Card>

        <Card elevation={2} style={styles.resultCard}>
          <Text style={[styles.resultLabel, { color: theme.colors.text.secondary }]}>
            {t('scanQR.scannedURL')}
          </Text>
          <Text style={[styles.resultText, { color: theme.colors.text.primary }]}>
            {scannedData || t('scanQR.noQRCodeScanned')}
          </Text>
        </Card>

        <View style={styles.buttonContainer}>
          <Button 
            title={t('scanQR.chooseFromGallery')}
            onPress={handleChooseFromGallery}
            style={styles.actionButton}
            variant="secondary"
            size="medium"
          />
          
          <Button 
            title={t('scanQR.backToLogin')}
            onPress={handleBackToLogin}
            style={styles.actionButton}
            variant="outline"
            size="medium"
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

// Styles remain mostly the same, with hardcoded colors removed
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 10, // Add padding to the top of the container
  },
  // Add these new style definitions
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50, // Adjust for status bar
    paddingBottom: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerRight: {
    width: 44, // Same width as back button for balanced layout
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16, // Increase vertical padding
    marginTop: 10, // Add margin to the top of the header
  },
  backButton: {
    padding: 10,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    width: 44,
    height: 44,
  },
  backButtonText: {
    marginLeft: 4,
    fontSize: 14,
  },
  placeholder: {
    width: 60,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  scannerCard: {
    width: '90%',
    aspectRatio: 1,
    padding: 0,
    overflow: 'hidden',
    marginBottom: 16,
    alignSelf: 'center',
    borderRadius: 12,
  },
  scannerWrapper: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanArea: {
    width: '70%',
    height: '70%',
    borderColor: 'transparent',
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: '#fff',
    borderWidth: 3,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderBottomWidth: 0,
    borderRightWidth: 0,
    borderTopLeftRadius: 10,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    borderTopRightRadius: 10,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderTopWidth: 0,
    borderRightWidth: 0,
    borderBottomLeftRadius: 10,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderBottomRightRadius: 10,
  },
  scannedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  scannedText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 20,
  },
  resultCard: {
    padding: 16,
    marginBottom: 16,
    borderRadius: 12,
  },
  resultLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  resultText: {
    fontSize: 16,
    fontWeight: '500',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 2,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1, // Use flex: 1 instead of 0.48
    height: 50,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  button: {
    marginTop: 16,
    minWidth: 150,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
  },
  subText: {
    textAlign: 'center',
    marginVertical: 20,
  },
  text: {
    fontSize: 16,
  },
});