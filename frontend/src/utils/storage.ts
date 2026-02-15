import AsyncStorage from '@react-native-async-storage/async-storage';

export const Storage = {
  get: async <T>(key: string): Promise<T | null> => {
    try {
      const v = await AsyncStorage.getItem(key);
      return v ? JSON.parse(v) : null;
    } catch {
      return null;
    }
  },
  set: async (key: string, value: any): Promise<void> => {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  },
  remove: async (key: string): Promise<void> => {
    await AsyncStorage.removeItem(key);
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
};
