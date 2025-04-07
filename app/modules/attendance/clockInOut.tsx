import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, ActivityIndicator, Alert } from 'react-native';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import useTheme from '../../themes/useTheme';
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { clockInOut, getClockStatus, getOfficeLocations } from '../../api/attendanceApi';

// Import components
import Card from '../../components/Card';
import Button from '../../components/Button';
import AlertMessage from '../../components/AlertMessage';
import LoadingIndicator from '../../components/LoadingIndicator';

// Interface for office location
interface OfficeLocation {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  radius: number;
  outOfFenceOverride: boolean;
}

export default function ClockInOutScreen() {
  const { t } = useTranslation();
  const { theme, isDark } = useTheme();
  const mapRef = useRef<MapView>(null);
  
  // State variables
  const [loading, setLoading] = useState(true);
  const [clockingInProgress, setClockingInProgress] = useState(false);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<'in' | 'out' | null>(null);
  const [lastActionTime, setLastActionTime] = useState<string | null>(null);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<'success' | 'error' | 'warning' | 'info'>('info');
  const [officeLocations, setOfficeLocations] = useState<OfficeLocation[]>([]);
  const [selectedOffice, setSelectedOffice] = useState<OfficeLocation | null>(null);
  const [gpsNotAvailable, setGpsNotAvailable] = useState(false);
  
  // Default map region (will be updated with actual data)
  const defaultRegion = {
    latitude: 3.1390,
    longitude: 101.6869,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  useEffect(() => {
    const initialize = async () => {
      try {
        // Get current clock status
        const statusResponse = await getClockStatus();
        if (statusResponse.success) {
          setLastAction(statusResponse.lastAction);
          setLastActionTime(statusResponse.lastActionTime);
        } else {
          showAlert('warning', statusResponse.message || 'Could not retrieve clock status');
        }
        
        // Get office locations
        const officesResponse = await getOfficeLocations();
        if (officesResponse.success && officesResponse.data && officesResponse.data.length > 0) {
          setOfficeLocations(officesResponse.data);
          // Set the first office as default selected office
          setSelectedOffice(officesResponse.data[0]);
        } else {
          showAlert('warning', 'Could not retrieve office locations');
        }
        
        // Request location permissions
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErrorMsg('Permission to access location was denied');
          showAlert('error', 'Location permission is required for clock in/out');
          setLoading(false);
          return;
        }
        
        // Get current location
        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High
        });
        setLocation(currentLocation);
        
        // Find closest office if we have both user location and office locations
        if (currentLocation && officesResponse.data && officesResponse.data.length > 0) {
          const closest = findClosestOffice(
            currentLocation.coords.latitude,
            currentLocation.coords.longitude,
            officesResponse.data
          );
          setSelectedOffice(closest);
        }
        
        // Animate map to current location
        if (mapRef.current && currentLocation) {
          mapRef.current.animateToRegion({
            latitude: currentLocation.coords.latitude,
            longitude: currentLocation.coords.longitude,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          }, 1000);
        }
      } catch (error) {
        console.error('Error initializing:', error);
        setErrorMsg('Could not get location or clock status');
        showAlert('error', 'Failed to initialize. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    initialize();
  }, []);
  
  // Find the closest office to the user's location
  const findClosestOffice = (
    userLat: number, 
    userLon: number, 
    offices: OfficeLocation[]
  ): OfficeLocation => {
    let closestOffice = offices[0];
    let shortestDistance = Number.MAX_VALUE;
    
    offices.forEach(office => {
      const distance = calculateDistance(
        userLat,
        userLon,
        office.latitude,
        office.longitude
      );
      
      if (distance < shortestDistance) {
        shortestDistance = distance;
        closestOffice = office;
      }
    });
    
    return closestOffice;
  };
  
  const showAlert = (type: 'success' | 'error' | 'warning' | 'info', message: string) => {
    setAlertType(type);
    setAlertMessage(message);
    setAlertVisible(true);
  };
  
  const handleClockAction = async () => {
    // Determine action based on last action
    const action = lastAction === 'in' ? 'out' : 'in';
    
    // Confirm with user
    Alert.alert(
      t('attendance.confirmClockTitle', 'Confirm Action'),
      t('attendance.confirmClockMessage', `Are you sure you want to clock ${action}?`),
      [
        {
          text: t('common.cancel', 'Cancel'),
          style: 'cancel'
        },
        {
          text: t('common.confirm', 'Confirm'),
          onPress: () => performClockAction(action)
        }
      ]
    );
  };
  
  const toggleGpsAvailability = () => {
      setGpsNotAvailable(!gpsNotAvailable);
      if (!gpsNotAvailable) {
        // If turning GPS off, show a message
        showAlert('warning', t('attendance.gpsDisabled', 'GPS has been marked as unavailable'));
      } else {
        // If turning GPS back on, try to get location again
        getLocationUpdate();
      }
    };
    
    const getLocationUpdate = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErrorMsg('Permission to access location was denied');
          return;
        }
        
        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High
        });
        setLocation(currentLocation);
        
        // Animate map to current location
        if (mapRef.current) {
          mapRef.current.animateToRegion({
            latitude: currentLocation.coords.latitude,
            longitude: currentLocation.coords.longitude,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          }, 1000);
        }
      } catch (error) {
        console.error('Error getting location update:', error);
        setErrorMsg('Could not get location');
      }
    };
    
    // Fix for the clockInOut function call - remove the 6th parameter
    const performClockAction = async (action: 'in' | 'out') => {
      setClockingInProgress(true);
      
      try {
        // Check if location is available and GPS is not marked as unavailable
        if (!location && !gpsNotAvailable) {
          try {
            const currentLocation = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.High
            });
            setLocation(currentLocation);
          } catch (error) {
            console.error('Error getting location:', error);
            showAlert('error', 'Could not get your location. Please try again or mark GPS as unavailable.');
            setClockingInProgress(false);
            return;
          }
        }
        
        // Check if user is within geofence of selected office
        let isOutOfFence = true;
        let officeName = selectedOffice?.name || 'Unknown Office';
        
        if (location && selectedOffice && !gpsNotAvailable) {
          const distance = calculateDistance(
            location.coords.latitude,
            location.coords.longitude,
            selectedOffice.latitude,
            selectedOffice.longitude
          );
          isOutOfFence = distance > selectedOffice.radius;
          
          // If out of fence but override is allowed
          if (isOutOfFence && selectedOffice.outOfFenceOverride) {
            isOutOfFence = false;
          }
        }
        
        // Call the API
        // Call the API with 5 parameters instead of 6
        const response = await clockInOut(
          undefined, // frontPhoto - not implemented yet
          undefined, // backPhoto - not implemented yet
          officeName, // authorizeZoneName
          isOutOfFence,
          gpsNotAvailable // isCameraBroken - repurpose this parameter for GPS availability
        );
        
        if (response.success) {
          setLastAction(action);
          setLastActionTime(new Date().toISOString());
          showAlert('success', response.message);
        } else {
          showAlert('error', response.message);
        }
      } catch (error) {
        console.error('Error during clock action:', error);
        showAlert('error', 'An unexpected error occurred');
      } finally {
        setClockingInProgress(false);
      }
    };
  
  // Calculate distance between two coordinates in meters
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // Earth radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;
    
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    
    return R * c; // Distance in meters
  };
  
  const formatTime = (isoString: string | null) => {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const formatDate = (isoString: string | null) => {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    return date.toLocaleDateString([], { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  const handleBackPress = () => {
    router.back();
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
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={handleBackPress}
        >
          <Ionicons 
            name="arrow-back" 
            size={24} 
            color={theme.colors.text.primary} 
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>
          {t('attendance.clockInOut', 'Clock In / Out')}
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
      ) : (
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Status Card */}
          <Card style={styles.statusCard}>
            <View style={styles.statusContainer}>
              <View 
                style={[
                  styles.statusIndicator, 
                  { 
                    backgroundColor: lastAction === 'in' 
                      ? theme.colors.status.success 
                      : theme.colors.status.error 
                  }
                ]} 
              />
              <Text style={[styles.statusText, { color: theme.colors.text.primary }]}>
                {lastAction === 'in' 
                  ? t('attendance.clockedIn', 'Clocked In') 
                  : t('attendance.clockedOut', 'Clocked Out')}
              </Text>
            </View>
            
            {lastActionTime && (
              <View style={styles.timeContainer}>
                <Ionicons name="time-outline" size={18} color={theme.colors.text.secondary} />
                <Text style={[styles.timeText, { color: theme.colors.text.secondary }]}>
                  {t('attendance.lastAction', 'Last action')}: {formatTime(lastActionTime)} on {formatDate(lastActionTime)}
                </Text>
              </View>
            )}
            
            <Button
              title={lastAction === 'in' 
                ? t('attendance.clockOut', 'Clock Out') 
                : t('attendance.clockIn', 'Clock In')}
              onPress={handleClockAction}
              variant={lastAction === 'in' ? 'secondary' : 'primary'}
              icon={lastAction === 'in' ? 'log-out-outline' : 'log-in-outline'}
              loading={clockingInProgress}
              style={styles.clockButton}
            />
          </Card>
          
          {/* Map Card */}
          <Card style={styles.mapCard}>
            <Text style={[styles.mapTitle, { color: theme.colors.text.primary }]}>
              {t('attendance.yourLocation', 'Your Location')}
            </Text>
            
            {selectedOffice && (
              <Text style={[styles.officeText, { color: theme.colors.text.secondary }]}>
                {t('attendance.nearestOffice', 'Nearest office')}: {selectedOffice.name}
              </Text>
            )}
            
            {/* GPS Toggle Button */}
            <TouchableOpacity
              style={[
                styles.gpsToggleButton,
                { backgroundColor: gpsNotAvailable ? theme.colors.status.error : theme.colors.status.success }
              ]}
              onPress={toggleGpsAvailability}
            >
              <Ionicons
                name={gpsNotAvailable ? "close-circle" : "location"} // Using "close-circle" instead of "location-slash"
                size={16}
                color="#fff"
              />
              <Text style={styles.gpsToggleText}>
                {gpsNotAvailable 
                  ? t('attendance.gpsNotAvailable', 'GPS Not Available') 
                  : t('attendance.gpsAvailable', 'GPS Available')}
              </Text>
            </TouchableOpacity>
            
            {errorMsg ? (
              <View style={styles.errorContainer}>
                <Ionicons name="warning-outline" size={24} color={theme.colors.status.error} />
                <Text style={[styles.errorText, { color: theme.colors.status.error }]}>
                  {errorMsg}
                </Text>
              </View>
            ) : (
              <View style={styles.mapContainer}>
                <MapView
                  ref={mapRef}
                  provider={PROVIDER_GOOGLE}
                  style={styles.map}
                  initialRegion={location ? {
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                    latitudeDelta: 0.005,
                    longitudeDelta: 0.005,
                  } : defaultRegion}
                >
                  {/* Office markers and geofences */}
                  {officeLocations.map((office) => (
                    <React.Fragment key={office.id}>
                      <Marker
                        coordinate={{
                          latitude: office.latitude,
                          longitude: office.longitude,
                        }}
                        title={office.name}
                        description={t('attendance.officeLocation', 'Office location')}
                      >
                        <Ionicons 
                          name="business" 
                          size={24} 
                          color={selectedOffice?.id === office.id ? theme.colors.primary : theme.colors.text.secondary} 
                        />
                      </Marker>
                      
                      <Circle
                        center={{
                          latitude: office.latitude,
                          longitude: office.longitude,
                        }}
                        radius={office.radius}
                        fillColor="rgba(0, 150, 255, 0.2)"
                        strokeColor="rgba(0, 150, 255, 0.5)"
                        strokeWidth={2}
                      />
                    </React.Fragment>
                  ))}
                  
                  {/* User location marker */}
                  {location && (
                    <Marker
                      coordinate={{
                        latitude: location.coords.latitude,
                        longitude: location.coords.longitude,
                      }}
                      title={t('attendance.yourPosition', 'You are here')}
                    >
                      <View style={styles.userMarker}>
                        <Ionicons name="person" size={16} color="#fff" />
                      </View>
                    </Marker>
                  )}
                </MapView>
                
                {/* Map overlay with location info */}
                {location && (
                  <View style={styles.locationInfoContainer}>
                    <Text style={[styles.locationInfoText, { color: theme.colors.text.primary }]}>
                      {t('attendance.latitude', 'Latitude')}: {location.coords.latitude.toFixed(6)}
                    </Text>
                    <Text style={[styles.locationInfoText, { color: theme.colors.text.primary }]}>
                      {t('attendance.longitude', 'Longitude')}: {location.coords.longitude.toFixed(6)}
                    </Text>
                    <Text style={[styles.locationInfoText, { color: theme.colors.text.primary }]}>
                      {t('attendance.accuracy', 'Accuracy')}: ±{Math.round(location.coords.accuracy || 0)}m
                    </Text>
                  </View>
                )}
              </View>
            )}
          </Card>
        </ScrollView>
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
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  statusCard: {
    padding: 20,
    marginBottom: 20,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusText: {
    fontSize: 18,
    fontWeight: '600',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  timeText: {
    fontSize: 14,
    marginLeft: 6,
  },
  clockButton: {
    marginTop: 8,
  },
  mapCard: {
    padding: 20,
  },
  mapTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  officeText: {
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  mapContainer: {
    height: 300,
    borderRadius: 8,
    overflow: 'hidden',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    marginTop: 8,
    textAlign: 'center',
  },
  userMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4285F4',
    borderWidth: 2,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationInfoContainer: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: 8,
    borderRadius: 8,
  },
  locationInfoText: {
    fontSize: 12,
  },
  gpsToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderRadius: 8,
    marginBottom: 16,
    alignSelf: 'center',
  },
  gpsToggleText: {
    color: '#fff',
    fontWeight: '500',
    marginLeft: 8,
  },
});