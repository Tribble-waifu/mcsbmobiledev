import AsyncStorage from '@react-native-async-storage/async-storage';

// Keys for storage
const STORAGE_KEYS = {
  SCANNED_QR_DATA: 'scanned_qr_data',
  AUTH_TOKEN: 'auth_token',
  USER_INFO: 'user_info',
  BASE_URL: 'base_url',
  REFRESH_TOKEN: 'refresh_token',
  USER_ROLES: 'user_roles',
  USER_ID: 'user_id',
  USER_TOKEN: 'user_token', // Add USER_TOKEN key for the token after profile selection
  COMPANY_ID: 'company_id', // Add COMPANY_ID key to store selected company
  MODULE_ACCESS: 'moduleAccess', // Add MODULE_ACCESS key for storing module permissions
  ACCESS_PERMISSIONS: 'accessPermissions', // Alternative key for module permissions
};

/**
 * Save scanned QR code data to storage
 * @param data The QR code data to save
 */
export const saveScannedQRData = async (data: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.SCANNED_QR_DATA, data);
  } catch (error) {
    console.error('Error saving scanned QR data:', error);
    throw error;
  }
};

/**
 * Save base URL to storage
 * @param url The base URL to save
 */
export const saveBaseUrl = async (url: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.BASE_URL, url);
  } catch (error) {
    console.error('Error saving base URL:', error);
    throw error;
  }
};

/**
 * Get the saved base URL from storage
 * @returns The saved base URL or null if not found
 */
export const getBaseUrl = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.BASE_URL);
  } catch (error) {
    console.error('Error getting base URL:', error);
    return null;
  }
};

/**
 * Get the saved QR code data from storage
 * @returns The saved QR code data or null if not found
 */
export const getScannedQRData = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.SCANNED_QR_DATA);
  } catch (error) {
    console.error('Error getting scanned QR data:', error);
    return null;
  }
};

/**
 * Clear the saved QR code data from storage
 */
export const clearScannedQRData = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.SCANNED_QR_DATA);
  } catch (error) {
    console.error('Error clearing scanned QR data:', error);
    throw error;
  }
};

// Additional auth-related storage functions that might be useful

/**
 * Save authentication token
 * @param token The auth token to save
 */
export const saveAuthToken = async (token: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
  } catch (error) {
    console.error('Error saving auth token:', error);
    throw error;
  }
};

/**
 * Get the saved authentication token
 * @returns The saved auth token or null if not found
 */
export const getAuthToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

/**
 * Save refresh token to storage
 * @param token The refresh token to save
 */
export const saveRefreshToken = async (token: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token);
  } catch (error) {
    console.error('Error saving refresh token:', error);
    throw error;
  }
};

/**
 * Get the saved refresh token
 * @returns The saved refresh token or null if not found
 */
export const getRefreshToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  } catch (error) {
    console.error('Error getting refresh token:', error);
    return null;
  }
};

/**
 * Save user roles to storage
 * @param roles Array of user roles
 */
export const saveUserRoles = async (roles: string[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.USER_ROLES, JSON.stringify(roles));
  } catch (error) {
    console.error('Error saving user roles:', error);
    throw error;
  }
};

/**
 * Get the saved user roles
 * @returns Array of user roles or empty array if not found
 */
export const getUserRoles = async (): Promise<string[]> => {
  try {
    const rolesJson = await AsyncStorage.getItem(STORAGE_KEYS.USER_ROLES);
    return rolesJson ? JSON.parse(rolesJson) : [];
  } catch (error) {
    console.error('Error getting user roles:', error);
    return [];
  }
};

/**
 * Save user ID to storage
 * @param userId The user ID to save
 */
export const saveUserId = async (userId: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.USER_ID, userId);
  } catch (error) {
    console.error('Error saving user ID:', error);
    throw error;
  }
};

/**
 * Get the saved user ID
 * @returns The saved user ID or null if not found
 */
export const getUserId = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.USER_ID);
  } catch (error) {
    console.error('Error getting user ID:', error);
    return null;
  }
};

/**
 * Save user token to storage
 * @param token The user token to save
 */
export const saveUserToken = async (token: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.USER_TOKEN, token);
  } catch (error) {
    console.error('Error saving user token:', error);
    throw error;
  }
};

/**
 * Get the saved user token
 * @returns The saved user token or null if not found
 */
export const getUserToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.USER_TOKEN);
  } catch (error) {
    console.error('Error getting user token:', error);
    return null;
  }
};

/**
 * Save company ID to storage
 * @param companyId The company ID to save
 */
export const saveCompanyId = async (companyId: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.COMPANY_ID, companyId);
  } catch (error) {
    console.error('Error saving company ID:', error);
    throw error;
  }
};

/**
 * Get the saved company ID
 * @returns The saved company ID or null if not found
 */
export const getCompanyId = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.COMPANY_ID);
  } catch (error) {
    console.error('Error getting company ID:', error);
    return null;
  }
};

/**
 * Save module access permissions to storage
 * @param moduleAccess The module access permissions object
 */
export const saveModuleAccess = async (moduleAccess: object): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.MODULE_ACCESS, JSON.stringify(moduleAccess));
    // Also save to the alternative key for backward compatibility
    await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_PERMISSIONS, JSON.stringify(moduleAccess));
  } catch (error) {
    console.error('Error saving module access:', error);
    throw error;
  }
};

/**
 * Get the saved module access permissions
 * @returns The saved module access permissions or null if not found
 */
export const getModuleAccess = async (): Promise<object | null> => {
  try {
    const moduleAccess = await AsyncStorage.getItem(STORAGE_KEYS.MODULE_ACCESS);
    if (moduleAccess) {
      return JSON.parse(moduleAccess);
    }
    
    // Try alternative key if primary key not found
    const accessPermissions = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_PERMISSIONS);
    if (accessPermissions) {
      return JSON.parse(accessPermissions);
    }
    
    return null;
  } catch (error) {
    console.error('Error getting module access:', error);
    return null;
  }
};

/**
 * Clear all authentication data from storage
 */
export const clearAuthData = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.SCANNED_QR_DATA,
      STORAGE_KEYS.AUTH_TOKEN,
      STORAGE_KEYS.USER_INFO,
      STORAGE_KEYS.BASE_URL,
      STORAGE_KEYS.REFRESH_TOKEN,
      STORAGE_KEYS.USER_ROLES,
      STORAGE_KEYS.USER_ID,
      STORAGE_KEYS.USER_TOKEN, // Include USER_TOKEN in the clear function
      STORAGE_KEYS.COMPANY_ID, // Include COMPANY_ID in the clear function
      STORAGE_KEYS.MODULE_ACCESS, // Include MODULE_ACCESS in the clear function
      STORAGE_KEYS.ACCESS_PERMISSIONS, // Include ACCESS_PERMISSIONS in the clear function
    ]);
  } catch (error) {
    console.error('Error clearing auth data:', error);
    throw error;
  }
};