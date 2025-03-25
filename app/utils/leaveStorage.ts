import AsyncStorage from '@react-native-async-storage/async-storage';
import { LeaveHistory, LeaveEntitlement, LeaveCodeSetting } from '../api/leaveApi';

// Update storage keys
const STORAGE_KEYS = {
  LEAVE_HISTORY: 'leave_history',
  LEAVE_ENTITLEMENTS: 'leave_entitlements',
  LEAVE_CODE_SETTINGS: 'leave_code_setting',
};

/**
 * Save leave history to AsyncStorage
 * @param leaveHistory Array of leave history items
 * @param year The year for which the leave history is saved
 */
export const saveLeaveHistory = async (leaveHistory: LeaveHistory[], year: number): Promise<void> => {
  try {
    const key = `${STORAGE_KEYS.LEAVE_HISTORY}_${year}`;
    const jsonValue = JSON.stringify(leaveHistory);
    await AsyncStorage.setItem(key, jsonValue);
  } catch (error) {
    console.error('Error saving leave history:', error);
    throw error;
  }
};

/**
 * Get leave history from AsyncStorage
 * @param year The year for which to retrieve leave history
 * @returns Array of leave history items or empty array if not found
 */
export const getLeaveHistoryFromStorage = async (year: number): Promise<LeaveHistory[]> => {
  try {
    const key = `${STORAGE_KEYS.LEAVE_HISTORY}_${year}`;
    const jsonValue = await AsyncStorage.getItem(key);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (error) {
    console.error('Error getting leave history from storage:', error);
    return [];
  }
};

/**
 * Clear leave history for a specific year from AsyncStorage
 * @param year The year for which to clear leave history
 */
export const clearLeaveHistory = async (year: number): Promise<void> => {
  try {
    const key = `${STORAGE_KEYS.LEAVE_HISTORY}_${year}`;
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error('Error clearing leave history:', error);
    throw error;
  }
};

/**
 * Clear all leave history from AsyncStorage
 */
export const clearAllLeaveHistory = async (): Promise<void> => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const leaveHistoryKeys = keys.filter(key => key.startsWith(STORAGE_KEYS.LEAVE_HISTORY));
    await AsyncStorage.multiRemove(leaveHistoryKeys);
  } catch (error) {
    console.error('Error clearing all leave history:', error);
    throw error;
  }
};

/**
 * Save leave entitlements to AsyncStorage
 * @param entitlements Array of leave entitlement items
 * @param year The year for which the leave entitlements are saved
 */
export const saveLeaveEntitlements = async (entitlements: LeaveEntitlement[], year: number): Promise<void> => {
  try {
    const key = `${STORAGE_KEYS.LEAVE_ENTITLEMENTS}_${year}`;
    const jsonValue = JSON.stringify(entitlements);
    await AsyncStorage.setItem(key, jsonValue);
  } catch (error) {
    console.error('Error saving leave entitlements:', error);
    throw error;
  }
};

/**
 * Get leave entitlements from AsyncStorage
 * @param year The year for which to retrieve leave entitlements
 * @returns Array of leave entitlement items or empty array if not found
 */
export const getLeaveEntitlementsFromStorage = async (year: number): Promise<LeaveEntitlement[]> => {
  try {
    const key = `${STORAGE_KEYS.LEAVE_ENTITLEMENTS}_${year}`;
    const jsonValue = await AsyncStorage.getItem(key);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (error) {
    console.error('Error getting leave entitlements from storage:', error);
    return [];
  }
};

/**
 * Clear leave entitlements for a specific year from AsyncStorage
 * @param year The year for which to clear leave entitlements
 */
export const clearLeaveEntitlements = async (year: number): Promise<void> => {
  try {
    const key = `${STORAGE_KEYS.LEAVE_ENTITLEMENTS}_${year}`;
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error('Error clearing leave entitlements:', error);
    throw error;
  }
};

/**
 * Clear all leave entitlements from AsyncStorage
 */
export const clearAllLeaveEntitlements = async (): Promise<void> => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const leaveEntitlementKeys = keys.filter(key => key.startsWith(STORAGE_KEYS.LEAVE_ENTITLEMENTS));
    await AsyncStorage.multiRemove(leaveEntitlementKeys);
  } catch (error) {
    console.error('Error clearing all leave entitlements:', error);
    throw error;
  }
};

/**
 * Save leave code settings to AsyncStorage
 * @param leaveCodeId The ID of the leave code
 * @param settings The leave code settings to save
 */
export const saveLeaveCodeSettings = async (leaveCodeId: number, settings: LeaveCodeSetting): Promise<void> => {
  try {
    const key = `${STORAGE_KEYS.LEAVE_CODE_SETTINGS}_${leaveCodeId}`;
    const jsonValue = JSON.stringify(settings);
    await AsyncStorage.setItem(key, jsonValue);
  } catch (error) {
    console.error('Error saving leave code settings:', error);
    throw error;
  }
};

/**
 * Get leave code settings from AsyncStorage
 * @param leaveCodeId The ID of the leave code
 * @returns Leave code settings or null if not found
 */
export const getLeaveCodeSettingsFromStorage = async (leaveCodeId: number): Promise<LeaveCodeSetting | null> => {
  try {
    const key = `${STORAGE_KEYS.LEAVE_CODE_SETTINGS}_${leaveCodeId}`;
    const jsonValue = await AsyncStorage.getItem(key);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (error) {
    console.error('Error getting leave code settings from storage:', error);
    return null;
  }
};

/**
 * Clear leave code settings for a specific leave code from AsyncStorage
 * @param leaveCodeId The ID of the leave code
 */
export const clearLeaveCodeSettings = async (leaveCodeId: number): Promise<void> => {
  try {
    const key = `${STORAGE_KEYS.LEAVE_CODE_SETTINGS}_${leaveCodeId}`;
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error('Error clearing leave code settings:', error);
    throw error;
  }
};

/**
 * Clear all leave code settings from AsyncStorage
 */
export const clearAllLeaveCodeSettings = async (): Promise<void> => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const leaveCodeSettingsKeys = keys.filter(key => key.startsWith(STORAGE_KEYS.LEAVE_CODE_SETTINGS));
    await AsyncStorage.multiRemove(leaveCodeSettingsKeys);
  } catch (error) {
    console.error('Error clearing all leave code settings:', error);
    throw error;
  }
};