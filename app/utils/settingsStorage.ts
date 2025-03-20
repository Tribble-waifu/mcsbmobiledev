import AsyncStorage from '@react-native-async-storage/async-storage';

// Keys for different settings
const KEYS = {
  LANGUAGE: 'app_language',
  THEME: 'app_theme',
  API_URL: 'api_url',
};

// Language settings
export const saveLanguage = async (language: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(KEYS.LANGUAGE, language);
  } catch (error) {
    console.error('Error saving language setting:', error);
    throw error;
  }
};

export const getLanguage = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(KEYS.LANGUAGE);
  } catch (error) {
    console.error('Error getting language setting:', error);
    return null;
  }
};

// Theme settings
export const saveTheme = async (isDarkMode: boolean): Promise<void> => {
  try {
    await AsyncStorage.setItem(KEYS.THEME, JSON.stringify(isDarkMode));
  } catch (error) {
    console.error('Error saving theme setting:', error);
    throw error;
  }
};

export const getTheme = async (): Promise<boolean | null> => {
  try {
    const theme = await AsyncStorage.getItem(KEYS.THEME);
    return theme ? JSON.parse(theme) : null;
  } catch (error) {
    console.error('Error getting theme setting:', error);
    return null;
  }
};

// API URL settings
export const saveApiUrl = async (url: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(KEYS.API_URL, url);
  } catch (error) {
    console.error('Error saving API URL setting:', error);
    throw error;
  }
};

export const getApiUrl = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(KEYS.API_URL);
  } catch (error) {
    console.error('Error getting API URL setting:', error);
    return null;
  }
};

// Clear all settings
export const clearAllSettings = async (): Promise<void> => {
  try {
    const keys = Object.values(KEYS);
    await AsyncStorage.multiRemove(keys);
  } catch (error) {
    console.error('Error clearing all settings:', error);
    throw error;
  }
};