import { getUserToken, getBaseUrl } from '../utils/authStorage';
import { UserProfile } from '../utils/userStorage';
// Change this import to use the correct function
import { getEmployeeId as getStoredEmployeeId } from '../utils/employeeStorage';

/**
 * Fetch user profile data from the API
 * @param employeeId The employee ID to fetch profile for
 * @returns The user profile data
 */
export const fetchUserProfile = async (employeeId: number | string): Promise<UserProfile> => {
  try {
    // Log the initial employeeId passed to the function
    
    // Get auth token and base URL
    const token = await getUserToken();
    const baseUrl = await getBaseUrl();
    
    if (!token || !baseUrl) {
      throw new Error('Authentication data or API URL not found');
    }
    
    // If no employeeId is provided, try to get it from storage
    if (!employeeId) {
      const storedEmployeeId = await getStoredEmployeeId();
      if (!storedEmployeeId) {
        throw new Error('Employee ID not found');
      }
      employeeId = storedEmployeeId;
    }
    
    // Construct the correct API URL
    const apiUrl = `${baseUrl}/v1/employees/${employeeId}/profile`;
    
    // Make the API request
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      console.error('API response error:', response.status);
      throw new Error(`API error: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (result.success && result.data) {
      return result.data;
    } else {
      throw new Error(result.message || 'Failed to fetch profile data');
    }
  } catch (error) {
    console.error('Error in fetchUserProfile:', error);
    throw error;
  }
};