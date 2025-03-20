import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from "jwt-decode";

// Keys for employee storage
const EMPLOYEE_STORAGE_KEYS = {
  EMPLOYEE_ID: 'employee_id',
  EMPLOYEE_NAME: 'employee_name',
  EMPLOYEE_NUMBER: 'employee_number',
  DEPARTMENT: 'department',
  JOB_TITLE: 'job_title',
  COMPANY_ID: 'company_id',
  COMPANY_NAME: 'company_name',
  EMAIL: 'email',
  IDENTITY_ID: 'identity_id',
  ROLES: 'roles',
  USER_PROFILE: 'user_profile', // Store the entire decoded profile
};

// Interface for the decoded JWT token
interface DecodedToken {
  unique_name: string;
  email: string;
  identity_id: string;
  role: string[];
  mfa_authenticated: string;
  nameid: string;
  employee_id: string;
  employee_name: string;
  employee_number: string;
  department: string;
  job_title: string;
  company_id: string;
  company_name: string;
  nbf: number;
  exp: number;
  iat: number;
}

/**
 * Decode and save employee information from JWT token
 * @param token The JWT token to decode and save
 * @returns Promise<boolean> indicating success or failure
 */
export const saveEmployeeInfoFromToken = async (token: string): Promise<boolean> => {
  try {
    // Decode the JWT token
    const decoded = jwtDecode<DecodedToken>(token);
    
    // Ensure we're saving the correct employee_id (1570 from the token)
    if (decoded.employee_id) {
      await AsyncStorage.setItem(EMPLOYEE_STORAGE_KEYS.EMPLOYEE_ID, decoded.employee_id);
    } else {
      console.error('No employee_id found in token');
    }
    
    // Save all other fields
    await AsyncStorage.setItem(EMPLOYEE_STORAGE_KEYS.EMPLOYEE_NAME, decoded.employee_name || '');
    await AsyncStorage.setItem(EMPLOYEE_STORAGE_KEYS.EMPLOYEE_NUMBER, decoded.employee_number || '');
    await AsyncStorage.setItem(EMPLOYEE_STORAGE_KEYS.DEPARTMENT, decoded.department || '');
    await AsyncStorage.setItem(EMPLOYEE_STORAGE_KEYS.JOB_TITLE, decoded.job_title || '');
    await AsyncStorage.setItem(EMPLOYEE_STORAGE_KEYS.COMPANY_ID, decoded.company_id || '');
    await AsyncStorage.setItem(EMPLOYEE_STORAGE_KEYS.COMPANY_NAME, decoded.company_name || '');
    await AsyncStorage.setItem(EMPLOYEE_STORAGE_KEYS.EMAIL, decoded.email || '');
    await AsyncStorage.setItem(EMPLOYEE_STORAGE_KEYS.IDENTITY_ID, decoded.identity_id || '');
    await AsyncStorage.setItem('unique_name', decoded.unique_name || '');
    await AsyncStorage.setItem('nameid', decoded.nameid || '');
    await AsyncStorage.setItem('mfa_authenticated', decoded.mfa_authenticated || '');
    
    // Save roles as JSON string
    await AsyncStorage.setItem(EMPLOYEE_STORAGE_KEYS.ROLES, JSON.stringify(decoded.role || []));
    
    // Save the entire profile as JSON for future use (excluding nbf, exp, iat)
    const profileToSave = {
      unique_name: decoded.unique_name,
      email: decoded.email,
      identity_id: decoded.identity_id,
      role: decoded.role,
      mfa_authenticated: decoded.mfa_authenticated,
      nameid: decoded.nameid,
      employee_id: decoded.employee_id,
      employee_name: decoded.employee_name,
      employee_number: decoded.employee_number,
      department: decoded.department,
      job_title: decoded.job_title,
      company_id: decoded.company_id,
      company_name: decoded.company_name
    };
    
    await AsyncStorage.setItem(EMPLOYEE_STORAGE_KEYS.USER_PROFILE, JSON.stringify(profileToSave));
    
    // Verify what was saved
    const savedEmployeeId = await AsyncStorage.getItem(EMPLOYEE_STORAGE_KEYS.EMPLOYEE_ID);
    
    return true;
  } catch (error) {
    console.error('Error saving employee info from token:', error);
    return false;
  }
};

/**
 * Get employee ID from storage
 * @returns Promise with employee ID or null
 */
export const getEmployeeId = async (): Promise<string | null> => {
  try {
    const employeeId = await AsyncStorage.getItem(EMPLOYEE_STORAGE_KEYS.EMPLOYEE_ID);
    return employeeId;
  } catch (error) {
    console.error('Error getting employee ID:', error);
    return null;
  }
};

/**
 * Get employee name from storage
 * @returns Promise with employee name or null
 */
export const getEmployeeName = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(EMPLOYEE_STORAGE_KEYS.EMPLOYEE_NAME);
  } catch (error) {
    console.error('Error getting employee name:', error);
    return null;
  }
};

/**
 * Get employee number from storage
 * @returns Promise with employee number or null
 */
export const getEmployeeNumber = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(EMPLOYEE_STORAGE_KEYS.EMPLOYEE_NUMBER);
  } catch (error) {
    console.error('Error getting employee number:', error);
    return null;
  }
};

/**
 * Get department from storage
 * @returns Promise with department or null
 */
export const getDepartment = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(EMPLOYEE_STORAGE_KEYS.DEPARTMENT);
  } catch (error) {
    console.error('Error getting department:', error);
    return null;
  }
};

/**
 * Get job title from storage
 * @returns Promise with job title or null
 */
export const getJobTitle = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(EMPLOYEE_STORAGE_KEYS.JOB_TITLE);
  } catch (error) {
    console.error('Error getting job title:', error);
    return null;
  }
};

/**
 * Get company name from storage
 * @returns Promise with company name or null
 */
export const getCompanyName = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(EMPLOYEE_STORAGE_KEYS.COMPANY_NAME);
  } catch (error) {
    console.error('Error getting company name:', error);
    return null;
  }
};

/**
 * Get email from storage
 * @returns Promise with email or null
 */
export const getEmail = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(EMPLOYEE_STORAGE_KEYS.EMAIL);
  } catch (error) {
    console.error('Error getting email:', error);
    return null;
  }
};

/**
 * Get roles from storage
 * @returns Promise with array of roles or empty array
 */
export const getRoles = async (): Promise<string[]> => {
  try {
    const rolesJson = await AsyncStorage.getItem(EMPLOYEE_STORAGE_KEYS.ROLES);
    return rolesJson ? JSON.parse(rolesJson) : [];
  } catch (error) {
    console.error('Error getting roles:', error);
    return [];
  }
};

/**
 * Get complete user profile from storage
 * @returns Promise with decoded token or null
 */
export const getUserProfile = async (): Promise<DecodedToken | null> => {
  try {
    const profileJson = await AsyncStorage.getItem(EMPLOYEE_STORAGE_KEYS.USER_PROFILE);
    return profileJson ? JSON.parse(profileJson) : null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
};

/**
 * Check if the token is expired
 * @returns Promise<boolean> true if expired, false if valid
 */
export const isTokenExpired = async (): Promise<boolean> => {
  try {
    const profile = await getUserProfile();
    if (!profile) return true;
    
    // Get current time in seconds
    const currentTime = Math.floor(Date.now() / 1000);
    
    // Check if token is expired
    return currentTime >= profile.exp;
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return true; // Assume expired on error
  }
};

/**
 * Clear all employee data from storage
 */
export const clearEmployeeData = async (): Promise<void> => {
  try {
    const keys = Object.values(EMPLOYEE_STORAGE_KEYS);
    await AsyncStorage.multiRemove(keys);
  } catch (error) {
    console.error('Error clearing employee data:', error);
    throw error;
  }
};
