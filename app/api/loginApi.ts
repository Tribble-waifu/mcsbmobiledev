import { getBaseUrl, getAuthToken, saveUserToken, getUserToken as getStoredUserToken } from '../utils/authStorage';
import { saveAuthToken, saveUserRoles, saveRefreshToken, saveUserId } from '../utils/authStorage';

interface LoginCredentials {
  username: string;
  password: string;
}

interface LoginResponse {
  success: boolean;
  message: string;
  data?: {
    accessToken: string;
    refreshToken: string;
    sessionId: string;
    mfaAuthenticated: boolean;
    identityId: string;
    userId: string | null;
    name: string;
    email: string;
    roles: string[];
    externals: any[];
  };
}

// Define interfaces for the user profile API response
interface Company {
  companyId: number;
  name: string;
}

interface UserProfile {
  userId: number;
  username: string;
  description: string;
  userRole: string;
  companies: Company[];
}

interface ProfileResponse {
  success: boolean;
  message: string;
  data: UserProfile[];
}

interface UserTokenResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
  };
}

/**
 * Authenticates a user with username and password
 * @param credentials Object containing username and password
 * @returns Promise with login response
 */
export const credentialLogin = async (credentials: LoginCredentials): Promise<LoginResponse> => {
  try {
    const baseUrl = await getBaseUrl();
    
    if (!baseUrl) {
      return {
        success: false,
        message: 'API URL not configured'
      };
    }

    const response = await fetch(`${baseUrl}/v1/auth/credentials-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(credentials)
    });

    const data = await response.json();
    
    // If login is successful, check for SUPER_ADMIN role
    if (data.success && data.data) {
      // Check if user has SUPER_ADMIN role
      if (data.data.roles && data.data.roles.includes('SUPER_ADMIN')) {
        return {
          success: false,
          message: 'Super Admin access is not allowed in the mobile app'
        };
      }
      
      // If not SUPER_ADMIN, save the auth data
      await saveAuthToken(data.data.accessToken);
      await saveRefreshToken(data.data.refreshToken);
      await saveUserRoles(data.data.roles);
      
      // Save userId if it exists
      if (data.data.userId) {
        await saveUserId(data.data.userId);
      }
    }
    
    return data;
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred during login'
    };
  }
};

/**
 * Fetches user profiles from the API
 * @returns Promise with user profiles response
 */
export const getUserProfiles = async (): Promise<ProfileResponse> => {
  try {
    const baseUrl = await getBaseUrl();
    const token = await getAuthToken();
    
    if (!baseUrl) {
      return {
        success: false,
        message: 'API URL not configured',
        data: []
      };
    }

    if (!token) {
      return {
        success: false,
        message: 'Authentication token not found',
        data: []
      };
    }

    const response = await fetch(`${baseUrl}/v1/auth/user-profiles`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    const data: ProfileResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching user profiles:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred while fetching profiles',
      data: []
    };
  }
};

/**
 * Gets user token for a specific user ID and company ID
 * @param userId The user ID
 * @param companyId The company ID
 * @returns Promise with user token response
 */
export const getUserToken = async (userId: number, companyId: number): Promise<UserTokenResponse> => {
  try {
    const baseUrl = await getBaseUrl();
    const token = await getAuthToken();
    
    if (!baseUrl) {
      return {
        success: false,
        message: 'API URL not configured',
        data: { token: '' }
      };
    }

    if (!token) {
      return {
        success: false,
        message: 'Authentication token not found',
        data: { token: '' }
      };
    }

    const response = await fetch(`${baseUrl}/v1/auth/userId/${userId}/token?companyId=${companyId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    const data: UserTokenResponse = await response.json();
    
    // If successful, save the user token
    if (data.success && data.data && data.data.token) {
      await saveUserToken(data.data.token);
    }
    
    return data;
  } catch (error) {
    console.error('Error getting user token:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred while getting user token',
      data: { token: '' }
    };
  }
};

interface ModuleAccess {
  isAffectESS: boolean;
  access: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
}

interface ModuleAccessResponse {
  success: boolean;
  message: string;
  data: {
    [key: string]: ModuleAccess;
  };
}

/**
 * Fetches module access permissions for the current user
 * @returns Promise with module access response
 */
export const getModuleAccess = async (): Promise<ModuleAccessResponse> => {
  try {
    const baseUrl = await getBaseUrl();
    const userToken = await getStoredUserToken();
    
    if (!baseUrl) {
      return {
        success: false,
        message: 'API URL not configured',
        data: {}
      };
    }

    if (!userToken) {
      return {
        success: false,
        message: 'User token not found',
        data: {}
      };
    }

    const response = await fetch(`${baseUrl}/v2/modules-access`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    const data: ModuleAccessResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching module access:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred while fetching module access',
      data: {}
    };
  }
};
