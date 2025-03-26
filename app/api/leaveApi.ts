import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUserToken, getBaseUrl } from '../utils/authStorage';
import { getEmployeeId } from '../utils/employeeStorage';
import { saveLeaveHistory, saveLeaveEntitlements, saveLeaveCodeSettings } from '../utils/leaveStorage';

// Define interfaces for leave-related data
export interface LeaveRequest {
  leaveTypeId: number;
  startDate: string;
  endDate: string;
  reason: string;
  attachmentUrl?: string;
}

export interface LeaveBalance {
  leaveTypeId: number;
  leaveTypeName: string;
  balance: number;
  taken: number;
  pending: number;
}

export interface LeaveDate {
  id: number;
  date: string;
  dayType: string;
  detail: string | null;
  day: number;
  session: string;
  sessionId: number;
}

export interface EmployeeInfo {
  employeeId: number;
  employeeNumber: string;
  name: string;
  departmentCode: string;
  departmentDesc: string;
  jobTitleCode: string;
  jobTitleDesc: string;
  dateJoin: string;
}

export interface LeaveEntitlement {
  leaveCodeId: number;
  effectiveFrom: string;
  effectiveTo: string;
  leaveCode: string;
  leaveCodeDesc: string;
  earnedDays: number;
  carryForwardDays: number;
  takenDays: number;
  adjustmentDays: number;
  balanceDays: number;
}

export interface LeaveEntitlementResponse {
  success: boolean;
  message: string;
  data: {
    employee: EmployeeInfo;
    entitlements: LeaveEntitlement[];
  };
}

export interface LeaveHistory {
  id: number;
  employeeId: number;
  familyMemberId: number | null;
  leaveCodeId: number;
  dateFrom: string;
  dateTo: string;
  totalDays: number;
  reason: string | null;
  cancellationReason: string | null;
  remark: string | null;
  approvalStatus: string;
  backupPersonEmployeeId: number | null;
  leaveDates: LeaveDate[];
  leaveCode: string;
  leaveCodeDesc: string;
  employeeNumber: string;
  employeeName: string;
  jobTitleDesc: string;
  departmentDesc: string;
  familyName: string | null;
  familyRelationship: string | null;
  createByUsername: string;
  createdDate: string;
  backupPersonEmployeeNumber: string | null;
  backupPersonEmployeeName: string | null;
  approvalStatusDisplay: string;
  attachmentList: any[];
}

export interface LeaveResponse {
  success: boolean;
  message: string;
  data: LeaveHistory[];
}

// Add the missing interfaces
export interface LeaveDateItem {
  date: string;
  sessionId: string | number;
}

export interface CreateLeaveApplicationResponse {
  success: boolean;
  message: string;
  data: {
    id: number;
    // Other properties returned by the API
  };
}

/**
 * Get leave history for the current employee
 * @param year Optional year filter (defaults to current year)
 * @returns Promise with leave history or error
 */
export const getLeaveHistory = async (year: number = new Date().getFullYear()): Promise<LeaveHistory[]> => {
  try {
    // Get values from storage instead of hardcoding
    const baseUrl = await getBaseUrl();
    const employeeId = await getEmployeeId();
    const token = await getUserToken();
    
    if (!baseUrl || !token || !employeeId) {
      throw new Error('Missing required authentication data');
    }
    
    const url = `${baseUrl}/v1/employees/${employeeId}/leaves?Year=${year}`;
    
    const response = await axios.get<LeaveResponse>(url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    if (response.data.success && response.data.data) {
      // Save the leave history to storage
      await saveLeaveHistory(response.data.data, year);
      return response.data.data;
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching leave history:', error);
    throw error;
  }
};

/**
 * Submit a new leave request
 * @param leaveRequest The leave request data
 * @returns Promise with the response data or error
 */
export const submitLeaveRequest = async (leaveRequest: LeaveRequest): Promise<any> => {
  // To be implemented
  return {};
};

/**
 * Cancel a pending leave request
 * @param leaveId The ID of the leave request to cancel
 * @returns Promise with the response data or error
 */
export const cancelLeaveRequest = async (leaveId: number): Promise<any> => {
  // To be implemented
  return {};
};

/**
 * Get available leave types
 * @returns Promise with leave types or error
 */
export const getLeaveTypes = async (): Promise<any[]> => {
  // To be implemented
  return [];
};

/**
 * Get details for a specific leave application
 * @param leaveId The ID of the leave application to retrieve
 * @returns Promise with the leave details or error
 */
export const getLeaveDetail = async (leaveId: number): Promise<LeaveHistory | null> => {
  try {
    // Get values from storage
    const baseUrl = await getBaseUrl();
    const employeeId = await getEmployeeId();
    const token = await getUserToken();
    
    if (!baseUrl || !token || !employeeId) {
      throw new Error('Missing required authentication data');
    }
    
    const url = `${baseUrl}/v1/employees/${employeeId}/leaves/${leaveId}`;
    
    const response = await axios.get<{success: boolean; message: string; data: LeaveHistory}>(url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching leave detail:', error);
    throw error;
  }
};

/**
 * Get leave entitlements for the current employee for a specific year
 * @param leaveYear Year for which to retrieve leave entitlements (defaults to current year)
 * @returns Promise with leave entitlements or error
 */
export const getLeaveEntitlement = async (leaveYear: number = new Date().getFullYear()): Promise<{
  employee: EmployeeInfo;
  entitlements: LeaveEntitlement[];
} | null> => {
  try {
    // Get values from storage
    const baseUrl = await getBaseUrl();
    const employeeId = await getEmployeeId();
    const token = await getUserToken();
    
    if (!baseUrl || !token || !employeeId) {
      throw new Error('Missing required authentication data');
    }
    
    const url = `${baseUrl}/v1/employees/${employeeId}/leaves/entitlements/year/${leaveYear}`;
    
    const response = await axios.get<LeaveEntitlementResponse>(url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    if (response.data.success && response.data.data) {
      // Save the leave entitlements to storage
      await saveLeaveEntitlements(response.data.data.entitlements, leaveYear);
      return response.data.data;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching leave entitlements:', error);
    throw error;
  }
};

// Define interface for leave code settings
export interface LeaveCodeSetting {
  leaveCodeId: number;
  leaveCode: string;
  description: string;
  allowBackdate: boolean;
  requireAttachment: boolean;
  requireFamily: boolean;
  isConsecutiveDay: boolean;
  annualLeaveNotificationPolicy: number;
  enableBackupPerson: boolean;
  maxDaysPerApplication: number;
  allowHalfDay: boolean;
  note: string;
}

export interface LeaveCodeSettingResponse {
  success: boolean;
  message: string;
  data: LeaveCodeSetting;
}

/**
 * Get leave code settings by leaveCodeId
 * @param leaveCodeId The ID of the leave code to fetch settings for
 * @returns Promise with leave code settings or error
 */
export const getLeaveCodeSetting = async (leaveCodeId: number): Promise<LeaveCodeSetting | null> => {
  try {
    // Get authentication data from storage
    const baseUrl = await getBaseUrl();
    const token = await getUserToken();
    
    if (!baseUrl || !token) {
      throw new Error('Missing required authentication data');
    }
    
    const url = `${baseUrl}/v1/leaves/settings/${leaveCodeId}`;
    
    const response = await axios.get<LeaveCodeSettingResponse>(url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    if (response.data.success && response.data.data) {
      // Store the leave code settings in AsyncStorage for offline access
      await AsyncStorage.setItem(`leave_code_setting_${leaveCodeId}`, JSON.stringify(response.data.data));
      return response.data.data;
    }
    
    return null;
  } catch (error) {
    console.error(`Error fetching leave code settings for ID ${leaveCodeId}:`, error);
    
    // Try to get cached settings if available
    try {
      const cachedSettings = await AsyncStorage.getItem(`leave_code_setting_${leaveCodeId}`);
      if (cachedSettings) {
        return JSON.parse(cachedSettings);
      }
    } catch (cacheError) {
      console.error('Error retrieving cached leave code settings:', cacheError);
    }
    
    throw error;
  }
};

/**
 * Format date to ISO string with time set to 00:00:00Z
 * @param date Date to format
 * @returns Formatted date string
 */
const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0] + 'T00:00:00Z';
};

/**
 * Create a new leave application
 * @param leaveCodeId The ID of the leave code
 * @param startDate The start date of the leave
 * @param endDate The end date of the leave
 * @param totalDays Total number of days for the leave
 * @param leaveDateList List of specific leave dates with session IDs
 * @param userId The user ID
 * @param options Optional parameters (reason, backupPersonEmployeeId, familyId)
 * @returns Promise with the response data or error
 */
export const createLeaveApplication = async (
  leaveCodeId: number,
  startDate: Date,
  endDate: Date,
  totalDays: number,
  leaveDateList: LeaveDateItem[],
  userId: number,
  options?: {
    reason?: string;
    backupPersonEmployeeId?: number;
    familyId?: number;
  }
): Promise<any> => {
  try {
    // Get authentication data from storage
    const baseUrl = await getBaseUrl();
    const token = await getUserToken();
    const employeeId = await getEmployeeId();
    
    if (!baseUrl || !token || !employeeId) {
      throw new Error('Missing required authentication data');
    }
    
    // Create form data for the request
    const formData = new FormData();
    formData.append('LeaveCodeId', leaveCodeId.toString());
    formData.append('Year', new Date().getFullYear().toString());
    
    // Format dates properly for API
    const formattedStartDate = startDate.toISOString().split('T')[0] + 'T00:00:00Z';
    const formattedEndDate = endDate.toISOString().split('T')[0] + 'T00:00:00Z';
    
    formData.append('DateFrom', formattedStartDate);
    formData.append('DateTo', formattedEndDate);
    formData.append('TotalDays', totalDays.toString());
    formData.append('UserId', userId.toString());
    
    // Add optional parameters if provided
    if (options?.reason) {
      formData.append('Reason', options.reason);
    }
    
    if (options?.backupPersonEmployeeId) {
      formData.append('BackupPersonEmployeeId', options.backupPersonEmployeeId.toString());
    }
    
    if (options?.familyId) {
      formData.append('FamilyId', options.familyId.toString());
    }
    
    // Add leave date list items individually with array notation in the key
    leaveDateList.forEach((dateItem, index) => {
      // Ensure date format is consistent
      formData.append(`LeaveDateList[${index}].Date`, dateItem.date);
      formData.append(`LeaveDateList[${index}].SessionId`, dateItem.sessionId.toString());
    });
    
    // Log the form data for debugging
    console.log('Sending form data to API:');
    for (const pair of (formData as any).entries()) {
      console.log(`${pair[0]}: ${pair[1]}`);
    }
    
    // Construct the URL for creating leave application
    const url = `${baseUrl}/v1/employees/${employeeId}/leaves`;
    
    // Make the API request
    const response = await axios.post<CreateLeaveApplicationResponse>(
      url,
      formData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        }
      }
    );
    
    if (response.data.success) {
      // Refresh leave history after successful application
      const currentYear = new Date().getFullYear();
      await getLeaveHistory(currentYear);
      return response.data;
    } else {
      throw new Error(response.data.message || 'Failed to create leave application');
    }
  } catch (error) {
    console.error('Error creating leave application:', error);
    throw error;
  }
};

// Define interface for available session
export interface AvailableSession {
  id: number;
  description: string;
}

// Define interface for leave application in the response
export interface LeaveAppListItem {
  leaveCode: string;
  session: string;
  approvalStatus: string;
}

// Define interface for leave date validation item
export interface LeaveDateValidationItem {
  date: string;
  availableSessions: AvailableSession[];
  typeOfDay: string;
  isWorkingDay: boolean;
  leaveAppList: LeaveAppListItem[];
  isHoliday: boolean;
  holiday: string;
  isConsecutive: boolean;
}

// Define interface for leave date validation response
export interface LeaveDateValidationResponse {
  success: boolean;
  message: string;
  data: LeaveDateValidationItem[];
}

/**
 * Check if the selected date range is available for leave application
 * @param leaveCodeId The ID of the leave code
 * @param startDate The start date of the leave
 * @param endDate The end date of the leave
 * @returns Promise with the validation data or error
 */
export const checkLeaveDateValidation = async (
  leaveCodeId: number,
  startDate: Date,
  endDate: Date
): Promise<LeaveDateValidationItem[]> => {
  try {
    // Get authentication data from storage
    const baseUrl = await getBaseUrl();
    const token = await getUserToken();
    const employeeId = await getEmployeeId();
    
    if (!baseUrl || !token || !employeeId) {
      throw new Error('Missing required authentication data');
    }
    
    // Format dates for API query with consistent format (YYYY-MM-DDT00:00:00.000Z)
    const formatDateForAPI = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}T00:00:00.000Z`;
    };
    
    const formattedStartDate = formatDateForAPI(startDate);
    const formattedEndDate = formatDateForAPI(endDate);
    
    console.log(`Checking leave date validation for dates: ${formattedStartDate} to ${formattedEndDate}`);
    
    // Construct the URL for checking leave date validation
    const url = `${baseUrl}/v1/employees/${employeeId}/leaves/leave-dates?LeaveCodeId=${leaveCodeId}&DateFrom=${formattedStartDate}&DateTo=${formattedEndDate}`;
    
    // Make the API request
    const response = await axios.get<LeaveDateValidationResponse>(
      url,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    if (response.data.success) {
      console.log('Leave date validation response:', response.data.data);
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'Failed to validate leave dates');
    }
  } catch (error) {
    console.error('Error validating leave dates:', error);
    throw error;
  }
};