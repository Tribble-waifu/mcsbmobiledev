import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import useTheme from '../../themes/useTheme';
import { viewNBAttachment } from '../../api/noticeboardApi';
import AlertMessage from '../../components/AlertMessage';
import WebView from 'react-native-webview';
import * as FileSystem from 'expo-file-system';

export default function NBAttachment() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { noticeId, attachmentId, fileName, mimeType } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<'success' | 'error' | 'warning' | 'info'>('info');

  // Function to load the attachment
  const loadAttachment = async () => {
    if (!noticeId || !attachmentId) {
      setError('Attachment information is missing');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Get the attachment URL and token
      const noticeIdValue = Array.isArray(noticeId) ? noticeId[0] : noticeId;
      const attachmentIdValue = Array.isArray(attachmentId) ? attachmentId[0] : attachmentId;
      
      const response = await viewNBAttachment(noticeIdValue, attachmentIdValue);
      
      if (response.success && response.url && response.token) {
        // Fetch the attachment data with the token
        const fetchResponse = await fetch(response.url, {
          headers: {
            "Authorization": `Bearer ${response.token}`
          }
        });
        
        if (!fetchResponse.ok) {
          throw new Error(`Failed to fetch attachment: ${fetchResponse.status}`);
        }
        
        // Get the blob data
        const blob = await fetchResponse.blob();
        
        // Convert blob to base64
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          const base64data = reader.result as string;
          // Extract the base64 content (remove the data URL prefix)
          const base64Content = base64data.split(',')[1];
          setPdfBase64(base64Content);
          setError(null);
          setLoading(false);
        };
      } else {
        setError(response.message || 'Failed to load attachment');
        setAlertType('error');
        setAlertMessage(response.message || 'Failed to load attachment');
        setAlertVisible(true);
        setLoading(false);
      }
    } catch (err) {
      console.error('Error in loadAttachment:', err);
      setError('An unexpected error occurred');
      setAlertType('error');
      setAlertMessage('An unexpected error occurred');
      setAlertVisible(true);
      setLoading(false);
    }
  };

  // Load attachment on component mount
  useEffect(() => {
    loadAttachment();
  }, [noticeId, attachmentId]);

  // Get file name for display
  const getDisplayFileName = () => {
    if (Array.isArray(fileName)) {
      return fileName[0] || 'Attachment';
    }
    return fileName || 'Attachment';
  };

  // Determine if the file is an image
  const isImageFile = () => {
    const fileNameStr = Array.isArray(fileName) ? fileName[0] : fileName || '';
    const mimeTypeStr = Array.isArray(mimeType) ? mimeType[0] : mimeType || '';
    
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
    const imageMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/webp'];
    
    return (
      imageExtensions.some(ext => fileNameStr.toLowerCase().endsWith(ext)) ||
      imageMimeTypes.some(type => mimeTypeStr.toLowerCase().includes(type))
    );
  };

  // Determine if the file is a PDF
  const isPdfFile = () => {
    const fileNameStr = Array.isArray(fileName) ? fileName[0] : fileName || '';
    const mimeTypeStr = Array.isArray(mimeType) ? mimeType[0] : mimeType || '';
    
    return fileNameStr.toLowerCase().endsWith('.pdf') || mimeTypeStr.includes('pdf');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      <Stack.Screen 
        options={{
          title: getDisplayFileName(),
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
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={60} color={theme.colors.text.secondary} />
          <Text style={[styles.errorText, { color: theme.colors.text.secondary }]}>
            {error}
          </Text>
        </View>
      ) : pdfBase64 ? (
        <View style={styles.pdfContainer}>
          {isImageFile() ? (
            // Image viewer
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
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        background-color: #000;
                        overflow: hidden;
                      }
                      .image-container {
                        width: 100%;
                        height: 100%;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        overflow: auto;
                      }
                      img {
                        max-width: 100%;
                        max-height: 100%;
                        object-fit: contain;
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
                        background-color: rgba(255,255,255,0.3);
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
                    <script src="https://cdnjs.cloudflare.com/ajax/libs/hammer.js/2.0.8/hammer.min.js"></script>
                  </head>
                  <body>
                    <div class="image-container" id="imageContainer">
                      <img src="data:image;base64,${pdfBase64}" id="imageViewer" />
                    </div>
                    <div class="controls">
                      <button class="control-button" id="zoomIn">+</button>
                      <button class="control-button" id="zoomOut">-</button>
                      <button class="control-button" id="resetZoom">↺</button>
                    </div>
                    <script>
                      // Variables for zoom and pan
                      let currentScale = 1;
                      let currentX = 0;
                      let currentY = 0;
                      const image = document.getElementById('imageViewer');
                      const container = document.getElementById('imageContainer');
                      
                      // Apply transform
                      function applyTransform() {
                        image.style.transform = \`translate(\${currentX}px, \${currentY}px) scale(\${currentScale})\`;
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
                        currentScale = 1;
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
                        if (currentScale === 1) {
                          currentScale = 2;
                        } else {
                          currentScale = 1;
                          currentX = 0;
                          currentY = 0;
                        }
                        applyTransform();
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
              scalesPageToFit={false}
              bounces={false}
              renderLoading={() => (
                <View style={styles.webViewLoading}>
                  <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
              )}
            />
          ) : isPdfFile() ? (
            // PDF viewer (existing code)
            Platform.OS === 'ios' ? (
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
              // Android PDF viewer (existing code)
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
            )
          ) : (
            // Generic file viewer for other file types
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
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        background-color: #f5f5f5;
                        font-family: Arial, sans-serif;
                      }
                      .file-info {
                        text-align: center;
                        padding: 20px;
                        max-width: 80%;
                      }
                      .file-icon {
                        font-size: 60px;
                        margin-bottom: 20px;
                        color: #666;
                      }
                      .file-name {
                        font-size: 18px;
                        font-weight: bold;
                        margin-bottom: 10px;
                        word-break: break-all;
                      }
                      .file-type {
                        font-size: 14px;
                        color: #666;
                        margin-bottom: 20px;
                      }
                      .download-btn {
                        background-color: #007bff;
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 5px;
                        font-size: 16px;
                        cursor: pointer;
                      }
                    </style>
                  </head>
                  <body>
                    <div class="file-info">
                      <div class="file-icon">📄</div>
                      <div class="file-name">${getDisplayFileName()}</div>
                      <div class="file-type">${Array.isArray(mimeType) ? mimeType[0] : mimeType || 'Unknown file type'}</div>
                      <p>This file type cannot be previewed directly in the app.</p>
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
              renderLoading={() => (
                <View style={styles.webViewLoading}>
                  <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
              )}
            />
          )}
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-text-outline" size={60} color={theme.colors.text.secondary} />
          <Text style={[styles.emptyText, { color: theme.colors.text.secondary }]}>
            {t('noticeboard.attachmentNotFound', 'Attachment not found')}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
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