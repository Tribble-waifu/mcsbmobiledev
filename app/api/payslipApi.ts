import { getBaseUrl, getUserToken } from '../utils/authStorage';
import { getEmployeeId } from '../utils/employeeStorage';

/**
 * Interface for payslip data returned from the API
 */
export interface Payslip {
  payrollDate: string;
  payrollType: string;
  payrollTypeDescription: string;
  fileName: string;
}

/**
 * Interface for the API response when fetching payslips
 */
export interface PayslipResponse {
  success: boolean;
  message: string;
  data: Payslip[];
}

/**
 * Fetch payslips for a specific year
 * @param year The year to fetch payslips for
 * @returns Promise with the payslip response
 */
export const fetchPayslips = async (year: string): Promise<PayslipResponse> => {
  try {
    // Get required data from storage
    const baseUrl = await getBaseUrl();
    const employeeId = await getEmployeeId();
    const userToken = await getUserToken();

    if (!baseUrl || !employeeId || !userToken) {
      console.error('[PayslipAPI] Missing auth data:', {
        hasBaseUrl: !!baseUrl,
        hasEmployeeId: !!employeeId,
        hasUserToken: !!userToken
      });
      throw new Error('Missing required authentication data');
    }

    // Construct the API URL
    const url = `${baseUrl}/v1/employees/${employeeId}/payslips/${year}`;

    // Make the API request
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Could not read error response');
      console.error(`[PayslipAPI] Error response: ${errorText}`);
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    console.log(`[PayslipAPI] Received ${data?.data?.length || 0} payslips`);
    return data as PayslipResponse;
  } catch (error) {
    console.error('Error fetching payslips:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      data: [],
    };
  }
};

/**
 * Fetch a specific payslip PDF
 * @param payrollType The payroll type (e.g., 'S')
 * @param payrollDate The payroll date in format 'YYYY-MM-DD'
 * @returns Promise with the PDF blob
 */
export const fetchPayslipPdf = async (payrollType: string, payrollDate: string): Promise<Blob> => {
  try {
    // Get required data from storage
    const baseUrl = await getBaseUrl();
    const employeeId = await getEmployeeId();
    const userToken = await getUserToken();

    if (!baseUrl || !employeeId || !userToken) {
      throw new Error('Missing required authentication data');
    }

    // Construct the API URL
    const url = `${baseUrl}/v1/employees/${employeeId}/payslips/${payrollType}/${payrollDate}`;

    // Make the API request
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'Accept': 'application/pdf',
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    // Return the PDF as a blob
    return await response.blob();
  } catch (error) {
    console.error('Error fetching payslip PDF:', error);
    throw error;
  }
};

/**
 * Download a payslip PDF and save it to the device
 * @param payrollType The payroll type (e.g., 'S')
 * @param payrollDate The payroll date in format 'YYYY-MM-DD'
 * @param fileName The name to save the file as
 * @returns Promise with the local file URI
 */
export const downloadPayslipPdf = async (
  payrollType: string, 
  payrollDate: string, 
  fileName: string
): Promise<string> => {
  try {
    // This function would use the fetchPayslipPdf function and then save the blob
    // to the device's file system. This requires additional libraries like
    // expo-file-system or react-native-fs.
    
    // For now, we'll just return a placeholder message
    // In a real implementation, you would:
    // 1. Fetch the PDF blob using fetchPayslipPdf
    // 2. Use FileSystem.downloadAsync or similar to save the blob
    // 3. Return the local URI of the saved file
    
    throw new Error('PDF download functionality requires additional implementation');
  } catch (error) {
    console.error('Error downloading payslip PDF:', error);
    throw error;
  }
};