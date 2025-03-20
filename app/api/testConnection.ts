/**
 * API utility to test connection to the server
 */
import { getBaseUrl } from '../utils/authStorage';

interface ConnectionResult {
  success: boolean;
  message: string;
  status?: number;
  data?: any;
}

/**
 * Tests the connection to the API server
 * @param customUrl Optional custom URL to test instead of the stored base URL
 * @returns Promise with connection test result
 */
export const testApiConnection = async (customUrl?: string): Promise<ConnectionResult> => {
  try {
    // Get the base URL from storage or use the provided custom URL
    const baseUrl = customUrl || await getBaseUrl();
    
    if (!baseUrl) {
      return {
        success: false,
        message: 'No API URL configured'
      };
    }

    // Create the full endpoint URL
    const endpoint = `${baseUrl}/status`;
    
    // Set up request with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    // Make the request
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      signal: controller.signal
    });
    
    // Clear the timeout
    clearTimeout(timeoutId);
    
    // Parse the response
    let data;
    try {
      data = await response.json();
    } catch (e) {
      // If response is not JSON, use text
      data = await response.text();
    }
    
    // Return the result
    return {
      success: response.ok,
      message: response.ok ? 'Connection successful' : `Server responded with status: ${response.status}`,
      status: response.status,
      data
    };
  } catch (error) {
    // Handle network errors or timeouts
    if (error instanceof DOMException && error.name === 'AbortError') {
      return {
        success: false,
        message: 'Connection timed out'
      };
    }
    
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};