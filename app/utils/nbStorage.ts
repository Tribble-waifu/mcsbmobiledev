import AsyncStorage from '@react-native-async-storage/async-storage';
import { NoticeboardItem, NoticeboardResponse, NoticeboardDetailItem } from '../api/noticeboardApi';

// Storage keys
const NB_LIST_KEY = 'noticeboard_list';
const NB_ITEM_PREFIX = 'noticeboard_item_';
const NB_LAST_FETCH_KEY = 'noticeboard_last_fetch';
const NB_DETAIL_PREFIX = 'noticeboard_detail_';
const NB_DETAIL_LAST_FETCH_PREFIX = 'noticeboard_detail_last_fetch_';

/**
 * Save the noticeboard list to local storage
 * @param data The noticeboard items to save
 */
export const saveNBList = async (data: NoticeboardItem[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(NB_LIST_KEY, JSON.stringify(data));
    await AsyncStorage.setItem(NB_LAST_FETCH_KEY, Date.now().toString());
  } catch (error) {
    console.error('Error saving noticeboard list to storage:', error);
  }
};

/**
 * Get the noticeboard list from local storage
 * @returns The stored noticeboard items or null if not found
 */
export const getNBListFromStorage = async (): Promise<NoticeboardItem[] | null> => {
  try {
    const data = await AsyncStorage.getItem(NB_LIST_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error retrieving noticeboard list from storage:', error);
    return null;
  }
};

/**
 * Save a specific noticeboard item to local storage
 * @param id The ID of the noticeboard item
 * @param data The noticeboard item data
 */
export const saveNBItem = async (id: number, data: any): Promise<void> => {
  try {
    await AsyncStorage.setItem(`${NB_ITEM_PREFIX}${id}`, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving noticeboard item ${id} to storage:`, error);
  }
};

/**
 * Get a specific noticeboard item from local storage
 * @param id The ID of the noticeboard item
 * @returns The stored noticeboard item or null if not found
 */
export const getNBItemFromStorage = async (id: number): Promise<any | null> => {
  try {
    const data = await AsyncStorage.getItem(`${NB_ITEM_PREFIX}${id}`);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error(`Error retrieving noticeboard item ${id} from storage:`, error);
    return null;
  }
};

/**
 * Check if the stored noticeboard list is stale (older than the specified time)
 * @param maxAge Maximum age in milliseconds (default: 1 hour)
 * @returns True if the data is stale or doesn't exist, false otherwise
 */
export const isNBListStale = async (maxAge: number = 3600000): Promise<boolean> => {
  try {
    const lastFetch = await AsyncStorage.getItem(NB_LAST_FETCH_KEY);
    if (!lastFetch) return true;
    
    const lastFetchTime = parseInt(lastFetch, 10);
    const now = Date.now();
    
    return (now - lastFetchTime) > maxAge;
  } catch (error) {
    console.error('Error checking if noticeboard list is stale:', error);
    return true;
  }
};

/**
 * Save detailed noticeboard item to local storage
 * @param id The ID of the noticeboard item
 * @param data The detailed noticeboard item data
 */
export const saveNBDetail = async (id: number | string, data: NoticeboardDetailItem): Promise<void> => {
  try {
    await AsyncStorage.setItem(`${NB_DETAIL_PREFIX}${id}`, JSON.stringify(data));
    await AsyncStorage.setItem(`${NB_DETAIL_LAST_FETCH_PREFIX}${id}`, Date.now().toString());
  } catch (error) {
    console.error(`Error saving noticeboard detail ${id} to storage:`, error);
  }
};

/**
 * Get detailed noticeboard item from local storage
 * @param id The ID of the noticeboard item
 * @returns The stored detailed noticeboard item or null if not found
 */
export const getNBDetailFromStorage = async (id: number | string): Promise<NoticeboardDetailItem | null> => {
  try {
    const data = await AsyncStorage.getItem(`${NB_DETAIL_PREFIX}${id}`);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error(`Error retrieving noticeboard detail ${id} from storage:`, error);
    return null;
  }
};

/**
 * Check if the stored noticeboard detail is stale (older than the specified time)
 * @param id The ID of the noticeboard item
 * @param maxAge Maximum age in milliseconds (default: 1 hour)
 * @returns True if the data is stale or doesn't exist, false otherwise
 */
export const isNBDetailStale = async (id: number | string, maxAge: number = 3600000): Promise<boolean> => {
  try {
    const lastFetch = await AsyncStorage.getItem(`${NB_DETAIL_LAST_FETCH_PREFIX}${id}`);
    if (!lastFetch) return true;
    
    const lastFetchTime = parseInt(lastFetch, 10);
    const now = Date.now();
    
    return (now - lastFetchTime) > maxAge;
  } catch (error) {
    console.error(`Error checking if noticeboard detail ${id} is stale:`, error);
    return true;
  }
};

/**
 * Clear all noticeboard data from storage
 */
export const clearNBStorage = async (): Promise<void> => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const nbKeys = keys.filter(key => 
      key === NB_LIST_KEY || 
      key === NB_LAST_FETCH_KEY || 
      key.startsWith(NB_ITEM_PREFIX) ||
      key.startsWith(NB_DETAIL_PREFIX) ||
      key.startsWith(NB_DETAIL_LAST_FETCH_PREFIX)
    );
    
    if (nbKeys.length > 0) {
      await AsyncStorage.multiRemove(nbKeys);
    }
  } catch (error) {
    console.error('Error clearing noticeboard storage:', error);
  }
};