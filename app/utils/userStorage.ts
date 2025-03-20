import AsyncStorage from '@react-native-async-storage/async-storage';

// Define the user profile interface
export interface UserProfile {
  id: number;
  employeeNumber: string;
  name: string;
  title: string;
  nickname: string;
  nationality: string;
  nric: string;
  passport: string;
  dateOfBirth: string;
  age: number;
  gender: string;
  resident: string;
  birthPlace: string;
  maritalStatus: string;
  bloodGroup: string;
  religion: string;
  ethnic: string;
  smoker: boolean;
}

// Storage keys
const USER_PROFILE_KEY = 'user_profile';

/**
 * Save user profile to AsyncStorage
 * @param profile User profile data
 */
export const saveUserProfile = async (profile: UserProfile): Promise<void> => {
  try {
    const jsonValue = JSON.stringify(profile);
    await AsyncStorage.setItem(USER_PROFILE_KEY, jsonValue);
  } catch (error) {
    console.error('Error saving user profile:', error);
    throw error;
  }
};

/**
 * Get user profile from AsyncStorage
 * @returns User profile or null if not found
 */
export const getUserProfile = async (): Promise<UserProfile | null> => {
  try {
    const jsonValue = await AsyncStorage.getItem(USER_PROFILE_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
};

/**
 * Clear user profile from AsyncStorage
 */
export const clearUserProfile = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(USER_PROFILE_KEY);
  } catch (error) {
    console.error('Error clearing user profile:', error);
    throw error;
  }
};