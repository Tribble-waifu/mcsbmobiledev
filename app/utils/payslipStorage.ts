import AsyncStorage from '@react-native-async-storage/async-storage';
import { Payslip } from '../api/payslipApi';

// Keys for payslip storage
const PAYSLIP_STORAGE_KEYS = {
  PAYSLIPS_BY_YEAR: 'payslips_by_year_',  // Will be appended with year (e.g., payslips_by_year_2023)
  PAYSLIP_PDF: 'payslip_pdf_',            // Will be appended with payrollType_date (e.g., payslip_pdf_S_2023-10-31)
  LAST_FETCH_TIME: 'payslips_last_fetch_', // Will be appended with year
  PAYSLIP_METADATA: 'payslip_metadata_',   // Will be appended with payrollType_date for storing metadata
};

/**
 * Save payslips for a specific year to storage
 * @param year The year for which payslips are being saved
 * @param payslips Array of payslip objects
 * @returns Promise indicating success or failure
 */
export const savePayslipsForYear = async (year: string, payslips: Payslip[]): Promise<boolean> => {
  try {
    const key = `${PAYSLIP_STORAGE_KEYS.PAYSLIPS_BY_YEAR}${year}`;
    await AsyncStorage.setItem(key, JSON.stringify(payslips));
    
    // Save the fetch time
    const fetchTimeKey = `${PAYSLIP_STORAGE_KEYS.LAST_FETCH_TIME}${year}`;
    await AsyncStorage.setItem(fetchTimeKey, Date.now().toString());
    
    // Also save individual payslip metadata for easier access
    for (const payslip of payslips) {
      const datePart = payslip.payrollDate.split('T')[0]; // Extract date part (YYYY-MM-DD)
      await savePayslipMetadata(payslip.payrollType, datePart, payslip);
    }
    
    return true;
  } catch (error) {
    console.error('Error saving payslips for year:', error);
    return false;
  }
};

/**
 * Save metadata for a specific payslip
 * @param payrollType The payroll type (e.g., 'S')
 * @param payrollDate The payroll date (YYYY-MM-DD format)
 * @param payslip The payslip object containing metadata
 * @returns Promise indicating success or failure
 */
export const savePayslipMetadata = async (
  payrollType: string,
  payrollDate: string,
  payslip: Payslip
): Promise<boolean> => {
  try {
    const key = `${PAYSLIP_STORAGE_KEYS.PAYSLIP_METADATA}${payrollType}_${payrollDate}`;
    await AsyncStorage.setItem(key, JSON.stringify(payslip));
    return true;
  } catch (error) {
    console.error('Error saving payslip metadata:', error);
    return false;
  }
};

/**
 * Get metadata for a specific payslip
 * @param payrollType The payroll type (e.g., 'S')
 * @param payrollDate The payroll date (YYYY-MM-DD format)
 * @returns Promise with the payslip metadata or null if not found
 */
export const getPayslipMetadata = async (
  payrollType: string,
  payrollDate: string
): Promise<Payslip | null> => {
  try {
    const key = `${PAYSLIP_STORAGE_KEYS.PAYSLIP_METADATA}${payrollType}_${payrollDate}`;
    const data = await AsyncStorage.getItem(key);
    
    if (!data) {
      return null;
    }
    
    return JSON.parse(data) as Payslip;
  } catch (error) {
    console.error('Error getting payslip metadata:', error);
    return null;
  }
};

/**
 * Get payslips for a specific year from storage
 * @param year The year for which to retrieve payslips
 * @returns Promise with array of payslips or null if not found
 */
export const getPayslipsForYear = async (year: string): Promise<Payslip[] | null> => {
  try {
    const key = `${PAYSLIP_STORAGE_KEYS.PAYSLIPS_BY_YEAR}${year}`;
    const payslipsJson = await AsyncStorage.getItem(key);
    
    if (!payslipsJson) {
      return null;
    }
    
    return JSON.parse(payslipsJson) as Payslip[];
  } catch (error) {
    console.error('Error getting payslips for year:', error);
    return null;
  }
};

/**
 * Check if payslips for a specific year need to be refreshed
 * @param year The year to check
 * @param maxAgeMs Maximum age in milliseconds before refresh is needed (default: 1 hour)
 * @returns Promise with boolean indicating if refresh is needed
 */
export const shouldRefreshPayslips = async (year: string, maxAgeMs: number = 3600000): Promise<boolean> => {
  try {
    const fetchTimeKey = `${PAYSLIP_STORAGE_KEYS.LAST_FETCH_TIME}${year}`;
    const lastFetchTimeStr = await AsyncStorage.getItem(fetchTimeKey);
    
    if (!lastFetchTimeStr) {
      return true; // No fetch time recorded, should refresh
    }
    
    const lastFetchTime = parseInt(lastFetchTimeStr, 10);
    const currentTime = Date.now();
    
    return (currentTime - lastFetchTime) > maxAgeMs;
  } catch (error) {
    console.error('Error checking if payslips should refresh:', error);
    return true; // On error, refresh to be safe
  }
};

/**
 * Save a payslip PDF to storage
 * @param payrollType The payroll type (e.g., 'S')
 * @param payrollDate The payroll date (e.g., '2023-10-31')
 * @param pdfData The PDF data as a base64 string
 * @returns Promise indicating success or failure
 */
export const savePayslipPdf = async (
  payrollType: string, 
  payrollDate: string, 
  pdfData: string
): Promise<boolean> => {
  try {
    const key = `${PAYSLIP_STORAGE_KEYS.PAYSLIP_PDF}${payrollType}_${payrollDate}`;
    await AsyncStorage.setItem(key, pdfData);
    return true;
  } catch (error) {
    console.error('Error saving payslip PDF:', error);
    return false;
  }
};

/**
 * Get a payslip PDF from storage
 * @param payrollType The payroll type (e.g., 'S')
 * @param payrollDate The payroll date (e.g., '2023-10-31')
 * @returns Promise with the PDF data as a base64 string or null if not found
 */
export const getPayslipPdf = async (
  payrollType: string, 
  payrollDate: string
): Promise<string | null> => {
  try {
    const key = `${PAYSLIP_STORAGE_KEYS.PAYSLIP_PDF}${payrollType}_${payrollDate}`;
    return await AsyncStorage.getItem(key);
  } catch (error) {
    console.error('Error getting payslip PDF:', error);
    return null;
  }
};

/**
 * Clear all payslip data from storage
 * @returns Promise indicating success or failure
 */
export const clearAllPayslipData = async (): Promise<boolean> => {
  try {
    // Get all keys from AsyncStorage
    const allKeys = await AsyncStorage.getAllKeys();
    
    // Filter keys related to payslips
    const payslipKeys = allKeys.filter(key => 
      key.startsWith(PAYSLIP_STORAGE_KEYS.PAYSLIPS_BY_YEAR) || 
      key.startsWith(PAYSLIP_STORAGE_KEYS.PAYSLIP_PDF) ||
      key.startsWith(PAYSLIP_STORAGE_KEYS.LAST_FETCH_TIME) ||
      key.startsWith(PAYSLIP_STORAGE_KEYS.PAYSLIP_METADATA)
    );
    
    // Remove all payslip-related keys
    if (payslipKeys.length > 0) {
      await AsyncStorage.multiRemove(payslipKeys);
    }
    
    return true;
  } catch (error) {
    console.error('Error clearing payslip data:', error);
    return false;
  }
};

/**
 * Clear payslip data for a specific year
 * @param year The year for which to clear data
 * @returns Promise indicating success or failure
 */
export const clearPayslipDataForYear = async (year: string): Promise<boolean> => {
  try {
    // Get all payslips for the year first
    const payslips = await getPayslipsForYear(year);
    
    if (payslips) {
      // Remove metadata for each payslip
      for (const payslip of payslips) {
        const datePart = payslip.payrollDate.split('T')[0];
        const metadataKey = `${PAYSLIP_STORAGE_KEYS.PAYSLIP_METADATA}${payslip.payrollType}_${datePart}`;
        const pdfKey = `${PAYSLIP_STORAGE_KEYS.PAYSLIP_PDF}${payslip.payrollType}_${datePart}`;
        
        await AsyncStorage.multiRemove([metadataKey, pdfKey]);
      }
    }
    
    // Remove year data and fetch time
    const payslipsKey = `${PAYSLIP_STORAGE_KEYS.PAYSLIPS_BY_YEAR}${year}`;
    const fetchTimeKey = `${PAYSLIP_STORAGE_KEYS.LAST_FETCH_TIME}${year}`;
    
    await AsyncStorage.multiRemove([payslipsKey, fetchTimeKey]);
    
    return true;
  } catch (error) {
    console.error('Error clearing payslip data for year:', error);
    return false;
  }
};