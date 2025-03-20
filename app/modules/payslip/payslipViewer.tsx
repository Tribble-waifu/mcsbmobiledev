import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  ActivityIndicator, 
  SafeAreaView,
  Text,
  TouchableOpacity,
  Platform,
  Share,
  Alert
} from 'react-native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as IntentLauncher from 'expo-intent-launcher';
import { useTranslation } from 'react-i18next';

// Import components
import Button from '../../components/Button';
import LoadingIndicator from '../../components/LoadingIndicator';
import AlertMessage from '../../components/AlertMessage';

// Import API and storage utilities
import { fetchPayslipPdf } from '../../api/payslipApi';
import { getPayslipPdf, savePayslipPdf, getPayslipMetadata } from '../../utils/payslipStorage';

// Import theme
import useTheme from '../../themes/useTheme';

const PayslipViewer: React.FC = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const params = useLocalSearchParams();
  
  // Extract params
  const payrollType = params.payrollType as string;
  const payrollDate = params.payrollDate as string;
  const fileName = params.fileName as string;
  
  // State variables
  const [loading, setLoading] = useState(true);
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<'success' | 'error' | 'warning' | 'info'>('info');
  const [pdfFilePath, setPdfFilePath] = useState<string | null>(null);
  
  // Load PDF when component mounts
  useEffect(() => {
    loadPayslipPdf();
    
    // Cleanup function to remove temporary files
    return () => {
      if (pdfFilePath) {
        FileSystem.deleteAsync(pdfFilePath, { idempotent: true }).catch(err => 
          console.error('Error cleaning up temporary file:', err)
        );
      }
    };
  }, [payrollType, payrollDate]);
  
  // Function to load payslip PDF from storage or API
  const loadPayslipPdf = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try to get PDF from storage first
      const storedPdf = await getPayslipPdf(payrollType, payrollDate);
      
      if (storedPdf) {
        // Use cached PDF if available
        setPdfBase64(storedPdf);
        await savePdfToFile(storedPdf);
        setLoading(false);
        return;
      }
      
      // Fetch from API if no cached PDF
      const pdfBlob = await fetchPayslipPdf(payrollType, payrollDate);
      
      // Convert blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(pdfBlob);
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        // Remove data URL prefix (e.g., "data:application/pdf;base64,")
        const base64Content = base64data.split(',')[1];
        
        // Save to storage for future use
        await savePayslipPdf(payrollType, payrollDate, base64Content);
        
        setPdfBase64(base64Content);
        await savePdfToFile(base64Content);
        setLoading(false);
      };
    } catch (err) {
      console.error('Error loading payslip PDF:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setLoading(false);
    }
  };
  
  // Save PDF to a temporary file
  const savePdfToFile = async (base64Content: string) => {
    try {
      // Create a unique filename to avoid conflicts
      const timestamp = new Date().getTime();
      const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9]/g, '_');
      const tempFileName = `${sanitizedFileName}_${timestamp}.pdf`;
      const fileUri = `${FileSystem.cacheDirectory}${tempFileName}`;
      
      // Write the base64 data to the file
      await FileSystem.writeAsStringAsync(fileUri, base64Content, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      setPdfFilePath(fileUri);
      return fileUri;
    } catch (err) {
      console.error('Error saving PDF to file:', err);
      return null;
    }
  };
  
  // Function to download and share the PDF
  const sharePayslip = async () => {
    if (!pdfBase64) {
      setAlertType('error');
      setAlertMessage(t('payslip.noPdfToShare', 'No PDF available to share'));
      setAlertVisible(true);
      return;
    }
    
    try {
      let fileUri = pdfFilePath;
      
      // If we don't have a file path yet, create one
      if (!fileUri) {
        fileUri = await savePdfToFile(pdfBase64);
      }
      
      if (!fileUri) {
        throw new Error('Failed to create file for sharing');
      }
      
      // Check if sharing is available (mainly for Android)
      const isSharingAvailable = await Sharing.isAvailableAsync();
      
      if (isSharingAvailable) {
        // Use Sharing API (works on both platforms)
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/pdf',
          dialogTitle: t('payslip.sharePayslip', 'Share Payslip'),
          UTI: 'com.adobe.pdf', // Uniform Type Identifier for iOS
        });
      } else if (Platform.OS === 'ios') {
        // Fallback for iOS
        await Share.share({
          url: fileUri,
          title: fileName,
        });
      } else {
        // Fallback for Android - open with system viewer
        const contentUri = await FileSystem.getContentUriAsync(fileUri);
        await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
          data: contentUri,
          flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
          type: 'application/pdf',
        });
      }
    } catch (err) {
      console.error('Error sharing payslip:', err);
      setAlertType('error');
      setAlertMessage(t('payslip.shareError', 'Error sharing payslip'));
      setAlertVisible(true);
    }
  };
  
  // Function to open PDF in external viewer
  const openInExternalViewer = async () => {
    if (!pdfBase64) {
      setAlertType('error');
      setAlertMessage(t('payslip.noPdfToOpen', 'No PDF available to open'));
      setAlertVisible(true);
      return;
    }
    
    try {
      let fileUri = pdfFilePath;
      
      // If we don't have a file path yet, create one
      if (!fileUri) {
        fileUri = await savePdfToFile(pdfBase64);
      }
      
      if (!fileUri) {
        throw new Error('Failed to create file for opening');
      }
      
      if (Platform.OS === 'ios') {
        // On iOS, use QuickLook
        const contentUri = await FileSystem.getContentUriAsync(fileUri);
        await IntentLauncher.startActivityAsync('com.apple.quicklook.QuickLookUIService', {
          data: contentUri,
          type: 'application/pdf',
        });
      } else {
        // On Android, use Intent system
        const contentUri = await FileSystem.getContentUriAsync(fileUri);
        await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
          data: contentUri,
          flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
          type: 'application/pdf',
        });
      }
    } catch (err) {
      console.error('Error opening payslip in external viewer:', err);
      setAlertType('error');
      setAlertMessage(t('payslip.openError', 'Error opening payslip'));
      setAlertVisible(true);
    }
  };
  
  // Format date for display (e.g., "31 Oct 2023")
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };
  
  // Get formatted date for display
  const displayDate = payrollDate ? formatDate(payrollDate) : '';
  
  // Determine the appropriate PDF viewer based on platform
  const renderPdfViewer = () => {
    if (!pdfBase64) return null;
    
    // For iOS, WebView works well
    if (Platform.OS === 'ios') {
      return (
        <WebView
          source={{
            html: `
              <!DOCTYPE html>
              <html>
              <head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no">
                <style>
                  body, html {
                    margin: 0;
                    padding: 0;
                    width: 100%;
                    height: 100%;
                    overflow: hidden;
                  }
                  embed {
                    width: 100%;
                    height: 100%;
                  }
                </style>
              </head>
              <body>
                <embed
                  src="data:application/pdf;base64,${pdfBase64}"
                  type="application/pdf"
                  width="100%"
                  height="100%"
                />
              </body>
              </html>
            `,
          }}
          style={styles.webView}
          originWhitelist={['*']}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.webViewLoading}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          )}
        />
      );
    }
    
    // For Android, WebView with PDF.js might be more reliable
    return (
      <WebView
        source={{
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no">
              <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.11.338/pdf.min.js"></script>
              <style>
                body, html {
                  margin: 0;
                  padding: 0;
                  width: 100%;
                  height: 100%;
                  overflow: hidden;
                  background-color: #f0f0f0;
                }
                #viewerContainer {
                  width: 100%;
                  height: 100%;
                  overflow: auto;
                  position: absolute;
                  top: 0;
                  left: 0;
                }
                #viewer {
                  width: 100%;
                  height: 100%;
                }
              </style>
            </head>
            <body>
              <div id="viewerContainer">
                <div id="viewer" class="pdfViewer"></div>
              </div>
              <script>
                // The workerSrc property needs to be specified
                pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.11.338/pdf.worker.min.js';

                // Base64 encoded PDF data
                const pdfData = atob('${pdfBase64}');
                
                // Convert base64 to array buffer
                const pdfBytes = new Uint8Array(pdfData.length);
                for (let i = 0; i < pdfData.length; i++) {
                  pdfBytes[i] = pdfData.charCodeAt(i);
                }
                
                // Load the PDF
                const loadingTask = pdfjsLib.getDocument({data: pdfBytes});
                loadingTask.promise.then(function(pdf) {
                  // Get the first page
                  pdf.getPage(1).then(function(page) {
                    const scale = 1.5;
                    const viewport = page.getViewport({scale: scale});
                    
                    // Prepare canvas using PDF page dimensions
                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d');
                    canvas.height = viewport.height;
                    canvas.width = viewport.width;
                    
                    // Append canvas to the viewer
                    document.getElementById('viewer').appendChild(canvas);
                    
                    // Render PDF page into canvas context
                    const renderContext = {
                      canvasContext: context,
                      viewport: viewport
                    };
                    
                    page.render(renderContext);
                  });
                  
                  // Load remaining pages
                  for(let pageNum = 2; pageNum <= pdf.numPages; pageNum++) {
                    pdf.getPage(pageNum).then(function(page) {
                      const scale = 1.5;
                      const viewport = page.getViewport({scale: scale});
                      
                      const canvas = document.createElement('canvas');
                      const context = canvas.getContext('2d');
                      canvas.height = viewport.height;
                      canvas.width = viewport.width;
                      
                      document.getElementById('viewer').appendChild(canvas);
                      
                      const renderContext = {
                        canvasContext: context,
                        viewport: viewport
                      };
                      
                      page.render(renderContext);
                    });
                  }
                });
              </script>
            </body>
            </html>
          `,
        }}
        style={styles.webView}
        originWhitelist={['*']}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.webViewLoading}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        )}
      />
    );
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      <Stack.Screen 
        options={{
          title: t('payslip.viewPayslip', 'View Payslip'),
          headerShown: true,
        }}
      />
      
      {/* Alert Messages */}
      <AlertMessage
        visible={alertVisible}
        type={alertType}
        message={alertMessage}
        onClose={() => setAlertVisible(false)}
      />
      
      {/* Header Info */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>
          {displayDate}
        </Text>
        {fileName && (
          <Text style={[styles.headerSubtitle, { color: theme.colors.text.secondary }]}>
            {fileName}
          </Text>
        )}
      </View>
      
      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <LoadingIndicator size={80} showText={true} />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons 
            name="alert-circle-outline" 
            size={80} 
            color={theme.colors.status.error} 
          />
          <Text style={[styles.errorText, { color: theme.colors.text.primary }]}>
            {error}
          </Text>
          <Button
            title={t('common.retry', 'Retry')}
            onPress={loadPayslipPdf}
            variant="primary"
            size="medium"
            icon="refresh-outline"
            style={styles.retryButton}
          />
        </View>
      ) : pdfBase64 ? (
        <View style={styles.pdfContainer}>
          {Platform.OS === 'ios' ? (
            <WebView
              source={{
                html: `
                  <!DOCTYPE html>
                  <html>
                  <head>
                    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes">
                    <style>
                      body, html {
                        margin: 0;
                        padding: 0;
                        width: 100%;
                        height: 100%;
                        overflow: auto;
                      }
                      embed {
                        width: 100%;
                        height: 100%;
                      }
                      .pdf-container {
                        width: 100%;
                        height: 100%;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                      }
                    </style>
                  </head>
                  <body>
                    <div class="pdf-container">
                      <embed
                        src="data:application/pdf;base64,${pdfBase64}"
                        type="application/pdf"
                        width="100%"
                        height="100%"
                      />
                    </div>
                  </body>
                  </html>
                `,
              }}
              style={styles.webView}
              originWhitelist={['*']}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              startInLoadingState={true}
              scalesPageToFit={true}
              bounces={true}
              renderLoading={() => (
                <View style={styles.webViewLoading}>
                  <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
              )}
            />
          ) : (
            <WebView
              source={{
                html: `
                  <!DOCTYPE html>
                  <html>
                  <head>
                    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes">
                    <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.11.338/pdf.min.js"></script>
                    <script src="https://cdnjs.cloudflare.com/ajax/libs/hammer.js/2.0.8/hammer.min.js"></script>
                    <style>
                      body, html {
                        margin: 0;
                        padding: 0;
                        width: 100%;
                        height: 100%;
                        overflow: hidden;
                        background-color: #f0f0f0;
                        touch-action: none;
                      }
                      #viewerContainer {
                        width: 100%;
                        height: 100%;
                        overflow: auto;
                        position: absolute;
                        top: 0;
                        left: 0;
                        touch-action: pan-x pan-y pinch-zoom;
                        -webkit-overflow-scrolling: touch;
                      }
                      #viewer {
                        width: 100%;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        transform-origin: 0 0;
                        transition: transform 0.1s ease-out;
                      }
                      canvas {
                        margin: 5px 0;
                        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
                        background-color: white;
                      }
                      .controls {
                        position: fixed;
                        bottom: 20px;
                        right: 20px;
                        display: flex;
                        flex-direction: column;
                        z-index: 100;
                      }
                      .control-button {
                        width: 40px;
                        height: 40px;
                        background-color: rgba(0,0,0,0.5);
                        color: white;
                        border: none;
                        border-radius: 20px;
                        margin: 5px;
                        font-size: 20px;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        cursor: pointer;
                      }
                    </style>
                  </head>
                  <body>
                    <div id="viewerContainer">
                      <div id="viewer" class="pdfViewer"></div>
                    </div>
                    <div class="controls">
                      <button class="control-button" id="zoomIn">+</button>
                      <button class="control-button" id="zoomOut">-</button>
                      <button class="control-button" id="resetZoom">↺</button>
                    </div>
                    <script>
                      // The workerSrc property needs to be specified
                      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.11.338/pdf.worker.min.js';

                      // Base64 encoded PDF data
                      const pdfData = atob('${pdfBase64}');
                      
                      // Convert base64 to array buffer
                      const pdfBytes = new Uint8Array(pdfData.length);
                      for (let i = 0; i < pdfData.length; i++) {
                        pdfBytes[i] = pdfData.charCodeAt(i);
                      }
                      
                      // Variables for zoom and pan
                      let currentScale = 1.5;
                      let currentX = 0;
                      let currentY = 0;
                      const viewer = document.getElementById('viewer');
                      const container = document.getElementById('viewerContainer');
                      
                      // Apply transform
                      function applyTransform() {
                        viewer.style.transform = \`translate(\${currentX}px, \${currentY}px) scale(\${currentScale})\`;
                      }
                      
                      // Zoom controls
                      document.getElementById('zoomIn').addEventListener('click', () => {
                        currentScale += 0.25;
                        applyTransform();
                      });
                      
                      document.getElementById('zoomOut').addEventListener('click', () => {
                        currentScale = Math.max(0.5, currentScale - 0.25);
                        applyTransform();
                      });
                      
                      document.getElementById('resetZoom').addEventListener('click', () => {
                        currentScale = 1.5;
                        currentX = 0;
                        currentY = 0;
                        applyTransform();
                      });
                      
                      // Setup Hammer.js for touch gestures
                      const hammer = new Hammer(container);
                      hammer.get('pinch').set({ enable: true });
                      hammer.get('pan').set({ direction: Hammer.DIRECTION_ALL });
                      
                      // Handle pinch to zoom
                      let startScale = 1;
                      hammer.on('pinchstart', (e) => {
                        startScale = currentScale;
                      });
                      
                      hammer.on('pinch', (e) => {
                        currentScale = Math.max(0.5, Math.min(5, startScale * e.scale));
                        applyTransform();
                      });
                      
                      // Handle pan
                      let lastPosX = 0;
                      let lastPosY = 0;
                      let isDragging = false;
                      
                      hammer.on('panstart', (e) => {
                        isDragging = true;
                        lastPosX = currentX;
                        lastPosY = currentY;
                      });
                      
                      hammer.on('pan', (e) => {
                        if (isDragging) {
                          currentX = lastPosX + e.deltaX;
                          currentY = lastPosY + e.deltaY;
                          applyTransform();
                        }
                      });
                      
                      hammer.on('panend', () => {
                        isDragging = false;
                      });
                      
                      // Double tap to zoom
                      hammer.on('doubletap', (e) => {
                        if (currentScale === 1.5) {
                          currentScale = 3;
                        } else {
                          currentScale = 1.5;
                          currentX = 0;
                          currentY = 0;
                        }
                        applyTransform();
                      });
                      
                      // Load the PDF
                      const loadingTask = pdfjsLib.getDocument({data: pdfBytes});
                      loadingTask.promise.then(function(pdf) {
                        // Get total pages
                        const numPages = pdf.numPages;
                        
                        // Render all pages
                        for(let pageNum = 1; pageNum <= numPages; pageNum++) {
                          pdf.getPage(pageNum).then(function(page) {
                            const scale = 1.5;
                            const viewport = page.getViewport({scale: scale});
                            
                            // Prepare canvas using PDF page dimensions
                            const canvas = document.createElement('canvas');
                            const context = canvas.getContext('2d');
                            canvas.height = viewport.height;
                            canvas.width = viewport.width;
                            
                            // Append canvas to the viewer
                            document.getElementById('viewer').appendChild(canvas);
                            
                            // Render PDF page into canvas context
                            const renderContext = {
                              canvasContext: context,
                              viewport: viewport
                            };
                            
                            page.render(renderContext);
                          });
                        }
                      });
                    </script>
                  </body>
                  </html>
                `,
              }}
              style={styles.webView}
              originWhitelist={['*']}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              startInLoadingState={true}
              scalesPageToFit={true}
              bounces={true}
              renderLoading={() => (
                <View style={styles.webViewLoading}>
                  <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
              )}
            />
          )}
        </View>
      ) : (
        <View style={styles.errorContainer}>
          <Ionicons 
            name="document-outline" 
            size={80} 
            color={theme.colors.text.secondary} 
          />
          <Text style={[styles.errorText, { color: theme.colors.text.primary }]}>
            {t('payslip.noPdfAvailable', 'No PDF available')}
          </Text>
        </View>
      )}
      
      {/* Action Buttons */}
      {pdfBase64 && (
        <View style={styles.actionButtons}>
          <Button
            title={t('payslip.share', 'Share')}
            onPress={sharePayslip}
            variant="primary"
            size="medium"
            icon="share-outline"
            style={styles.actionButton}
          />
          {Platform.OS === 'android' && (
            <Button
              title={t('payslip.openExternal', 'Open')}
              onPress={async () => {
                try {
                  // Create a temporary file
                  const fileUri = `${FileSystem.cacheDirectory}${fileName}`;
                  
                  // Write the base64 data to the file
                  await FileSystem.writeAsStringAsync(fileUri, pdfBase64, {
                    encoding: FileSystem.EncodingType.Base64,
                  });
                  
                  // Get content URI for Android
                  const contentUri = await FileSystem.getContentUriAsync(fileUri);
                  
                  // Open with external viewer
                  await Sharing.shareAsync(contentUri, {
                    mimeType: 'application/pdf',
                    dialogTitle: t('payslip.openWith', 'Open with'),
                    UTI: 'com.adobe.pdf'
                  });
                } catch (err) {
                  console.error('Error opening external viewer:', err);
                  setAlertType('error');
                  setAlertMessage(t('payslip.openError', 'Error opening PDF'));
                  setAlertVisible(true);
                }
              }}
              variant="secondary"
              size="medium"
              icon="open-outline"
              style={styles.actionButton}
            />
          )}
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  pdfContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  webView: {
    flex: 1,
  },
  webViewLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 12,
  },
  actionButton: {
    minWidth: 120,
  },
});

export default PayslipViewer;