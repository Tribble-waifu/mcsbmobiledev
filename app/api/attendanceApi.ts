import { getUserToken, getBaseUrl } from '../utils/authStorage';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Function to get employee ID from AsyncStorage
const getEmployeeId = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem('employeeId');
  } catch (error) {
    console.error('Error getting employee ID:', error);
    return null;
  }
};

// Interface for authorized zone (office location)
interface AuthorizedZone {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  radius: number;
  outOfFenceOverride: boolean;
}

// Interface for authorized zones response
interface AuthorizedZonesResponse {
  success: boolean;
  message: string;
  data?: AuthorizedZone[];
  error?: string;
}

/**
 * Function to get all authorized office locations
 * @returns Promise with the response containing authorized zones
 */
export const getOfficeLocations = async (): Promise<AuthorizedZonesResponse> => {
  try {
    const baseUrl = await getBaseUrl();
    const userToken = await getUserToken();

    if (!baseUrl || !userToken) {
      return {
        success: false,
        message: 'Missing authentication information',
        error: 'MISSING_AUTH_INFO'
      };
    }

    // Make API request to get authorized zones
    const response = await fetch(
      `${baseUrl}/v1/attendance/authorized-zones`, 
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${userToken}`
        }
      }
    );

    const responseData = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: responseData.message || `Error: ${response.status} ${response.statusText}`,
        error: responseData.error || 'API_ERROR'
      };
    }

    return {
      success: true,
      message: responseData.message || 'Successfully retrieved office locations',
      data: responseData.data
    };
  } catch (error) {
    console.error('Error in getOfficeLocations:', error);
    return {
      success: false,
      message: 'An unexpected error occurred',
      error: error instanceof Error ? error.message : 'UNKNOWN_ERROR'
    };
  }
};

// Interface for the clock in/out request
interface ClockInOutRequest {
  employeeId: string;
  timeEntry: string;
  latitude: number;
  latitudeDelta: number;
  longitude: number;
  longitudeDelta: number;
  authorizeZoneName?: string;
  frontPhoto?: string; // Base64 encoded image
  backPhoto?: string; // Base64 encoded image
  isOutOfFence: boolean;
  isCameraBroken: boolean;
  gpsNotAvailable: boolean;
}

// Interface for the clock in/out response
interface ClockInOutResponse {
  success: boolean;
  message: string;
  data?: {
    id: string;
    employeeId: string;
    timeEntry: string;
    type: 'in' | 'out';
    // Add other fields as needed
  };
  error?: string;
}

/**
 * Function to clock in or out
 * @param frontPhoto Base64 encoded front camera image (optional)
 * @param backPhoto Base64 encoded back camera image (optional)
 * @param authorizeZoneName Zone name if applicable (optional)
 * @param isOutOfFence Whether the user is outside the geofence (default: false)
 * @param isCameraBroken Whether the camera is broken (default: false)
 * @returns Promise with the response
 */
export const clockInOut = async (
  frontPhoto?: string,
  backPhoto?: string,
  authorizeZoneName?: string,
  isOutOfFence: boolean = false,
  isCameraBroken: boolean = false
): Promise<ClockInOutResponse> => {
  try {
    // Get required data from storage
    const baseUrl = await getBaseUrl();
    const userToken = await getUserToken();
    const employeeId = await getEmployeeId();

    if (!baseUrl || !userToken || !employeeId) {
      return {
        success: false,
        message: 'Missing authentication information',
        error: 'MISSING_AUTH_INFO'
      };
    }

    // Get current location
    let location;
    let gpsNotAvailable = false;
    let latitude = 0;
    let longitude = 0;
    let latitudeDelta = 0.005; // Default accuracy
    let longitudeDelta = 0.005; // Default accuracy

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        gpsNotAvailable = true;
      } else {
        location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High
        });
        
        if (location) {
          latitude = location.coords.latitude;
          longitude = location.coords.longitude;
          
          // Calculate deltas based on accuracy
          const accuracy = location.coords.accuracy || 5;
          latitudeDelta = accuracy * 0.0001; // Convert accuracy to appropriate delta
          longitudeDelta = accuracy * 0.0001;
        } else {
          gpsNotAvailable = true;
        }
      }
    } catch (error) {
      console.error('Error getting location:', error);
      gpsNotAvailable = true;
    }

    // If no specific authorized zone name is provided, try to determine it from location
    if (!authorizeZoneName && !gpsNotAvailable && location) {
      try {
        // Get all authorized office locations
        const officeLocationsResponse = await getOfficeLocations();
        
        if (officeLocationsResponse.success && officeLocationsResponse.data && officeLocationsResponse.data.length > 0) {
          // Find the closest office or one that the user is within
          let closestOffice = null;
          let shortestDistance = Number.MAX_VALUE;
          
          for (const office of officeLocationsResponse.data) {
            // Calculate distance between user and this office
            const distance = calculateDistance(
              latitude,
              longitude,
              office.latitude,
              office.longitude
            );
            
            // If user is within this office's radius, use this office
            if (distance <= office.radius) {
              authorizeZoneName = office.name;
              isOutOfFence = false;
              break;
            }
            
            // Otherwise, keep track of the closest office
            if (distance < shortestDistance) {
              shortestDistance = distance;
              closestOffice = office;
            }
          }
          
          // If no office was within radius, use the closest one
          if (!authorizeZoneName && closestOffice) {
            authorizeZoneName = closestOffice.name;
            isOutOfFence = !closestOffice.outOfFenceOverride;
          }
        }
      } catch (error) {
        console.error('Error determining office location:', error);
        // Continue with the clock operation even if we couldn't determine the office
      }
    }

    // Prepare request body
    const requestBody: ClockInOutRequest = {
      employeeId,
      timeEntry: new Date().toISOString(),
      latitude,
      latitudeDelta,
      longitude,
      longitudeDelta,
      authorizeZoneName,
      frontPhoto,
      backPhoto,
      isOutOfFence,
      isCameraBroken,
      gpsNotAvailable
    };

    // Make API request
    const response = await fetch(`${baseUrl}/v1/attendance/time-logs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify(requestBody)
    });

    const responseData = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: responseData.message || `Error: ${response.status} ${response.statusText}`,
        error: responseData.error || 'API_ERROR'
      };
    }

    return {
      success: true,
      message: responseData.message || 'Clock operation successful',
      data: responseData.data
    };
  } catch (error) {
    console.error('Error in clockInOut:', error);
    return {
      success: false,
      message: 'An unexpected error occurred',
      error: error instanceof Error ? error.message : 'UNKNOWN_ERROR'
    };
  }
};

/**
 * Function to get the current clock status of the employee
 * @returns Promise with the response containing the last clock action
 */
export const getClockStatus = async (): Promise<{
  success: boolean;
  lastAction: 'in' | 'out' | null;
  lastActionTime: string | null;
  message?: string;
}> => {
  try {
    const baseUrl = await getBaseUrl();
    const userToken = await getUserToken();
    const employeeId = await getEmployeeId();

    if (!baseUrl || !userToken || !employeeId) {
      return {
        success: false,
        lastAction: null,
        lastActionTime: null,
        message: 'Missing authentication information'
      };
    }

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    
    // Make API request to get today's time logs
    const response = await fetch(
      `${baseUrl}/v1/attendance/time-logs?employeeId=${employeeId}&date=${today}`, 
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${userToken}`
        }
      }
    );

    const responseData = await response.json();

    if (!response.ok) {
      return {
        success: false,
        lastAction: null,
        lastActionTime: null,
        message: responseData.message || 'Failed to get clock status'
      };
    }

    // If no time logs for today
    if (!responseData.data || responseData.data.length === 0) {
      return {
        success: true,
        lastAction: 'out', // Assume clocked out if no records
        lastActionTime: null
      };
    }

    // Sort time logs by timeEntry in descending order to get the latest
    const sortedLogs = responseData.data.sort((a: any, b: any) => {
      return new Date(b.timeEntry).getTime() - new Date(a.timeEntry).getTime();
    });

    // Get the latest time log
    const latestLog = sortedLogs[0];
    
    return {
      success: true,
      lastAction: latestLog.type || null,
      lastActionTime: latestLog.timeEntry || null
    };
  } catch (error) {
    console.error('Error in getClockStatus:', error);
    return {
      success: false,
      lastAction: null,
      lastActionTime: null,
      message: 'An unexpected error occurred'
    };
  }
};

/**
 * Calculate distance between two coordinates in meters using the Haversine formula
 * @param lat1 Latitude of first point
 * @param lon1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lon2 Longitude of second point
 * @returns Distance in meters
 */
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
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