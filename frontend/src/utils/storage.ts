import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Helper to check if we're on web platform (checked dynamically for proper hydration)
const isWebPlatform = () => {
  return Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage;
};

export const Storage = {
  get: async <T>(key: string): Promise<T | null> => {
    try {
      if (isWebPlatform()) {
        const v = window.localStorage.getItem(key);
        return v ? JSON.parse(v) : null;
      }
      const v = await AsyncStorage.getItem(key);
      return v ? JSON.parse(v) : null;
    } catch (err) {
      console.warn('Storage.get error:', err);
      return null;
    }
  },
  set: async (key: string, value: any): Promise<void> => {
    try {
      const jsonValue = JSON.stringify(value);
      if (isWebPlatform()) {
        window.localStorage.setItem(key, jsonValue);
        return;
      }
      await AsyncStorage.setItem(key, jsonValue);
    } catch (err) {
      console.warn('Storage.set error:', err);
    }
  },
  remove: async (key: string): Promise<void> => {
    try {
      if (isWebPlatform()) {
        window.localStorage.removeItem(key);
        return;
      }
      await AsyncStorage.removeItem(key);
    } catch (err) {
      console.warn('Storage.remove error:', err);
    }
  },
};

export const KEYS = {
  ONBOARDED: 'peptrack_onboarded',
  WAIVER_ACCEPTED: 'peptrack_waiver_accepted',
  GOALS: 'peptrack_goals',
  TRACKER_ITEMS: 'peptrack_tracker',
  DOSE_LOGS: 'peptrack_doses',
  JOURNAL_ENTRIES: 'peptrack_journal',
  CALCULATOR_PRESETS: 'peptrack_presets',
  SETTINGS: 'peptrack_settings',
  USER: 'peptrack_user',
  FAVORITES: 'peptrack_favorites',
  CUSTOM_PEPTIDES: 'peptrack_custom_peptides',
  CUSTOM_MEDS: 'peptrack_custom_meds',
  THEME_MODE: 'peptrack_theme_mode',
  RECURRING_ITEMS: 'peptrack_recurring_items',
  REMINDERS: 'peptrack_reminders',
  NOTIFICATIONS_ENABLED: 'peptrack_notifications_enabled',
  INJECTION_SITES: 'peptrack_injection_sites',
  AI_SUMMARIES: 'peptrack_ai_summaries',
  WORKOUT_HISTORY: 'peptrack_workout_history',
};
