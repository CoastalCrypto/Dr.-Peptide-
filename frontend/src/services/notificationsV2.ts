import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Storage, KEYS } from '../utils/storage';
import { api } from '../utils/api';

// Configure notifications behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface ScheduledReminder {
  id: string;
  type: 'dose' | 'journal' | 'weekly_summary';
  itemId?: string;
  itemName?: string;
  notificationIds: string[];
  hour: number;
  minute: number;
  days: number[]; // 0-6 for Sun-Sat
  enabled: boolean;
  createdAt: string;
}

export interface NotificationSettings {
  doseRemindersEnabled: boolean;
  journalReminderEnabled: boolean;
  journalReminderTime: { hour: number; minute: number };
  weeklySummaryEnabled: boolean;
  weeklySummaryDay: number; // 0=Sun, 1=Mon, etc.
  weeklySummaryTime: { hour: number; minute: number };
}

const DEFAULT_SETTINGS: NotificationSettings = {
  doseRemindersEnabled: true,
  journalReminderEnabled: true,
  journalReminderTime: { hour: 20, minute: 0 }, // 8 PM
  weeklySummaryEnabled: true,
  weeklySummaryDay: 0, // Sunday
  weeklySummaryTime: { hour: 10, minute: 0 }, // 10 AM
};

export const NotificationServiceV2 = {
  // Request permissions for local notifications
  requestPermissions: async (): Promise<boolean> => {
    if (Platform.OS === 'web') {
      return false;
    }
    
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    return finalStatus === 'granted';
  },

  // Get notification settings
  getSettings: async (): Promise<NotificationSettings> => {
    const settings = await Storage.get<NotificationSettings>('peptrack_notification_settings');
    return settings || DEFAULT_SETTINGS;
  },

  // Save notification settings
  saveSettings: async (settings: NotificationSettings): Promise<void> => {
    await Storage.set('peptrack_notification_settings', settings);
  },

  // ==================== DOSE REMINDERS ====================
  
  scheduleDoseReminder: async (
    itemId: string,
    itemName: string,
    times: string[], // ['Morning', 'Evening']
    days: number[] = [0, 1, 2, 3, 4, 5, 6]
  ): Promise<string[]> => {
    if (Platform.OS === 'web') return [];
    
    const notificationIds: string[] = [];
    
    for (const timeStr of times) {
      const { hour, minute } = NotificationServiceV2.parseTimeToHours(timeStr);
      
      for (const weekday of days) {
        try {
          const id = await Notifications.scheduleNotificationAsync({
            content: {
              title: `💉 Time for ${itemName}`,
              body: `Don't forget to take your ${itemName} dose!`,
              sound: 'default',
              priority: Notifications.AndroidNotificationPriority.HIGH,
              data: { type: 'dose', itemId, itemName },
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
              weekday: weekday + 1, // expo uses 1-7
              hour,
              minute,
            },
          });
          notificationIds.push(id);
        } catch (error) {
          console.error('Failed to schedule dose reminder:', error);
        }
      }
    }
    
    // Save reminder info
    const reminders = await Storage.get<ScheduledReminder[]>(KEYS.REMINDERS) || [];
    reminders.push({
      id: `dose_${itemId}_${Date.now()}`,
      type: 'dose',
      itemId,
      itemName,
      notificationIds,
      hour: NotificationServiceV2.parseTimeToHours(times[0]).hour,
      minute: NotificationServiceV2.parseTimeToHours(times[0]).minute,
      days,
      enabled: true,
      createdAt: new Date().toISOString(),
    });
    await Storage.set(KEYS.REMINDERS, reminders);
    
    return notificationIds;
  },

  cancelDoseReminders: async (itemId: string): Promise<void> => {
    const reminders = await Storage.get<ScheduledReminder[]>(KEYS.REMINDERS) || [];
    const itemReminders = reminders.filter(r => r.type === 'dose' && r.itemId === itemId);
    
    for (const reminder of itemReminders) {
      for (const notifId of reminder.notificationIds) {
        try {
          await Notifications.cancelScheduledNotificationAsync(notifId);
        } catch (e) {}
      }
    }
    
    const updated = reminders.filter(r => !(r.type === 'dose' && r.itemId === itemId));
    await Storage.set(KEYS.REMINDERS, updated);
  },

  // ==================== JOURNAL REMINDER ====================
  
  scheduleJournalReminder: async (hour: number = 20, minute: number = 0): Promise<string | null> => {
    if (Platform.OS === 'web') return null;
    
    // Cancel existing journal reminder first
    await NotificationServiceV2.cancelJournalReminder();
    
    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: '📝 Time to Log Your Health',
          body: 'How are you feeling today? Take a moment to log your health metrics.',
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.DEFAULT,
          data: { type: 'journal' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute,
        },
      });
      
      // Save reminder
      const reminders = await Storage.get<ScheduledReminder[]>(KEYS.REMINDERS) || [];
      reminders.push({
        id: `journal_daily`,
        type: 'journal',
        notificationIds: [id],
        hour,
        minute,
        days: [0, 1, 2, 3, 4, 5, 6],
        enabled: true,
        createdAt: new Date().toISOString(),
      });
      await Storage.set(KEYS.REMINDERS, reminders);
      
      return id;
    } catch (error) {
      console.error('Failed to schedule journal reminder:', error);
      return null;
    }
  },

  cancelJournalReminder: async (): Promise<void> => {
    const reminders = await Storage.get<ScheduledReminder[]>(KEYS.REMINDERS) || [];
    const journalReminders = reminders.filter(r => r.type === 'journal');
    
    for (const reminder of journalReminders) {
      for (const notifId of reminder.notificationIds) {
        try {
          await Notifications.cancelScheduledNotificationAsync(notifId);
        } catch (e) {}
      }
    }
    
    const updated = reminders.filter(r => r.type !== 'journal');
    await Storage.set(KEYS.REMINDERS, updated);
  },

  // ==================== WEEKLY SUMMARY ====================
  
  scheduleWeeklySummary: async (weekday: number = 0, hour: number = 10, minute: number = 0): Promise<string | null> => {
    if (Platform.OS === 'web') return null;
    
    // Cancel existing weekly summary first
    await NotificationServiceV2.cancelWeeklySummary();
    
    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: '📊 Your Weekly Health Summary',
          body: 'Your weekly health report is ready! Tap to view your progress and AI insights.',
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.DEFAULT,
          data: { type: 'weekly_summary' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday: weekday + 1, // expo uses 1-7
          hour,
          minute,
        },
      });
      
      // Save reminder
      const reminders = await Storage.get<ScheduledReminder[]>(KEYS.REMINDERS) || [];
      reminders.push({
        id: `weekly_summary`,
        type: 'weekly_summary',
        notificationIds: [id],
        hour,
        minute,
        days: [weekday],
        enabled: true,
        createdAt: new Date().toISOString(),
      });
      await Storage.set(KEYS.REMINDERS, reminders);
      
      return id;
    } catch (error) {
      console.error('Failed to schedule weekly summary:', error);
      return null;
    }
  },

  cancelWeeklySummary: async (): Promise<void> => {
    const reminders = await Storage.get<ScheduledReminder[]>(KEYS.REMINDERS) || [];
    const summaryReminders = reminders.filter(r => r.type === 'weekly_summary');
    
    for (const reminder of summaryReminders) {
      for (const notifId of reminder.notificationIds) {
        try {
          await Notifications.cancelScheduledNotificationAsync(notifId);
        } catch (e) {}
      }
    }
    
    const updated = reminders.filter(r => r.type !== 'weekly_summary');
    await Storage.set(KEYS.REMINDERS, updated);
  },

  // ==================== UTILITY FUNCTIONS ====================
  
  cancelAllNotifications: async (): Promise<void> => {
    await Notifications.cancelAllScheduledNotificationsAsync();
    await Storage.remove(KEYS.REMINDERS);
  },

  getScheduledNotifications: async () => {
    return await Notifications.getAllScheduledNotificationsAsync();
  },

  getReminders: async (): Promise<ScheduledReminder[]> => {
    return await Storage.get<ScheduledReminder[]>(KEYS.REMINDERS) || [];
  },

  parseTimeToHours: (timeStr: string): { hour: number; minute: number } => {
    const timeMap: Record<string, { hour: number; minute: number }> = {
      'Morning': { hour: 8, minute: 0 },
      'Afternoon': { hour: 13, minute: 0 },
      'Evening': { hour: 18, minute: 0 },
      'Night': { hour: 21, minute: 0 },
      'Bedtime': { hour: 22, minute: 0 },
    };
    return timeMap[timeStr] || { hour: 9, minute: 0 };
  },

  // Setup all notifications based on user settings
  setupAllNotifications: async (): Promise<void> => {
    const settings = await NotificationServiceV2.getSettings();
    
    // Setup journal reminder
    if (settings.journalReminderEnabled) {
      await NotificationServiceV2.scheduleJournalReminder(
        settings.journalReminderTime.hour,
        settings.journalReminderTime.minute
      );
    }
    
    // Setup weekly summary
    if (settings.weeklySummaryEnabled) {
      await NotificationServiceV2.scheduleWeeklySummary(
        settings.weeklySummaryDay,
        settings.weeklySummaryTime.hour,
        settings.weeklySummaryTime.minute
      );
    }
    
    // Dose reminders are set per-item when user creates recurring items
  },
};

// Re-export original service for backwards compatibility
export { NotificationService } from './notifications';
