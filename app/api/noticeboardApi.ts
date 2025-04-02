import { getUserToken, getBaseUrl } from '../utils/authStorage';

// Define interfaces for the API response
// Add the export keyword to the interface definition
export interface NoticeboardItem {
  id: number;
  title: string;
  content: string;
  publishDate: string;
  expiryDate: string;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  // Add the fields from your actual response
  importantNotice: boolean;
  message: string;
  noticeTitle: string;
  effectiveDateFrom: string;
  hasAttachment: boolean;
}

export interface NoticeboardAttachment {
  id: number;
  fileName: string;
  mimeType: string;
}

export interface NoticeboardDetailItem extends NoticeboardItem {
  effectiveDateTo: string | null;
  attachments?: NoticeboardAttachment[];
}

export interface NoticeboardResponse {
  success: boolean;
  message: string;
  data: NoticeboardItem[];
}

export interface NoticeboardDetailResponse {
  success: boolean;
  message: string;
  data: NoticeboardDetailItem;
}

/**
 * Get the list of noticeboard items
 * @returns Promise with the noticeboard data or error
 */
export const getNBList = async (): Promise<NoticeboardResponse> => {
  try {
    // Get the authentication token and base URL
    const userToken = await getUserToken();
    const baseUrl = await getBaseUrl();

    if (!userToken) {
      throw new Error('Authentication token not found');
    }

    if (!baseUrl) {
      throw new Error('API base URL not found');
    }

    // Make the API request
    const response = await fetch(`${baseUrl}/v1/notice-board`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    // Parse the response
    const data = await response.json();

    // Check if the request was successful
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch noticeboard items');
    }

    return data;
  } catch (error) {
    console.error('Error fetching noticeboard items:', error);
    // Return a formatted error response
    return {
      success: false,
      message: error instanceof Error ? error.message : 'An unknown error occurred',
      data: [],
    };
  }
};

/**
 * Get a specific noticeboard item by ID
 * @param id The ID of the noticeboard item to fetch
 * @returns Promise with the noticeboard item data or error
 */
export const getNBItem = async (id: number): Promise<any> => {
  try {
    const userToken = await getUserToken();
    const baseUrl = await getBaseUrl();

    if (!userToken) {
      throw new Error('Authentication token not found');
    }

    if (!baseUrl) {
      throw new Error('API base URL not found');
    }

    const response = await fetch(`${baseUrl}/v1/notice-board/${id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch noticeboard item');
    }

    return data;
  } catch (error) {
    console.error(`Error fetching noticeboard item with ID ${id}:`, error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'An unknown error occurred',
      data: null,
    };
  }
};

/**
 * Get detailed information about a specific noticeboard item
 * @param noticeBoardId The ID of the noticeboard item to fetch details for
 * @returns Promise with the detailed noticeboard item data or error
 */
export const getNBDetail = async (noticeBoardId: number | string): Promise<NoticeboardDetailResponse> => {
  try {
    // Get the authentication token and base URL
    const userToken = await getUserToken();
    const baseUrl = await getBaseUrl();

    if (!userToken) {
      throw new Error('Authentication token not found');
    }

    if (!baseUrl) {
      throw new Error('API base URL not found');
    }

    // Make the API request
    const response = await fetch(`${baseUrl}/v1/notice-board/${noticeBoardId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    // Parse the response
    const data = await response.json();

    // Check if the request was successful
    if (!response.ok) {
      throw new Error(data.message || `Failed to fetch details for noticeboard item ${noticeBoardId}`);
    }

    return data;
  } catch (error) {
    console.error(`Error fetching noticeboard detail for ID ${noticeBoardId}:`, error);
    // Return a formatted error response
    return {
      success: false,
      message: error instanceof Error ? error.message : 'An unknown error occurred',
      data: {} as NoticeboardDetailItem,
    };
  }
};

/**
 * Generate a URL to view a noticeboard attachment
 * @param noticeBoardId The ID of the noticeboard item
 * @param attachmentId The ID of the attachment to view
 * @returns Promise with the URL to view the attachment or error message
 */
export const viewNBAttachment = async (
  noticeBoardId: number | string,
  attachmentId: number | string
): Promise<{ success: boolean; url?: string; token?: string; message?: string }> => {
  try {
    // Get the authentication token and base URL
    const userToken = await getUserToken();
    const baseUrl = await getBaseUrl();

    if (!userToken) {
      throw new Error('Authentication token not found');
    }

    if (!baseUrl) {
      throw new Error('API base URL not found');
    }

    // Generate the URL to view the attachment
    const attachmentUrl = `${baseUrl}/v1/notice-board/${noticeBoardId}/files/${attachmentId}`;

    // Return the URL with the token for authentication
    return {
      success: true,
      url: attachmentUrl,
      // Include the token so it can be used in the Authorization header when opening the URL
      token: userToken
    };
  } catch (error) {
    console.error(`Error generating URL for attachment ${attachmentId} of noticeboard ${noticeBoardId}:`, error);
    // Return a formatted error response
    return {
      success: false,
      message: error instanceof Error ? error.message : 'An unknown error occurred',
    };
  }
};