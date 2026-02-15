import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Storage, KEYS } from '../utils/storage';

// Configure notifications behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface ScheduledReminder {
  id: string;
  itemId: string;
  itemName: string;
  time: string; // HH:MM format
  days: number[]; // 0-6 for Sun-Sat
  enabled: boolean;
}

export const NotificationService = {
  // Request permissions for local notifications
  requestPermissions: async (): Promise<boolean> => {
    if (Platform.OS === 'web') {
      return false; // Notifications not supported on web
    }
    
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    return finalStatus === 'granted';
  },

  // Schedule a local notification
  scheduleNotification: async (
    title: string,
    body: string,
    trigger: Notifications.NotificationTriggerInput
  ): Promise<string | null> => {
    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger,
      });
      return id;
    } catch (error) {
      console.error('Failed to schedule notification:', error);
      return null;
    }
  },

  // Schedule daily reminder for a dose
  scheduleDoseReminder: async (
    itemId: string,
    itemName: string,
    hour: number,
    minute: number,
    days: number[] = [0, 1, 2, 3, 4, 5, 6] // All days by default
  ): Promise<string[]> => {
    const notificationIds: string[] = [];
    
    for (const weekday of days) {
      const trigger: Notifications.WeeklyTriggerInput = {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: weekday + 1, // expo-notifications uses 1-7 (Sun=1)
        hour,
        minute,
      };
      
      const id = await NotificationService.scheduleNotification(
        `Time for ${itemName}`,
        `Don't forget to take your ${itemName} dose!`,
        trigger
      );
      
      if (id) {
        notificationIds.push(id);
      }
    }
    
    return notificationIds;
  },

  // Cancel a specific notification
  cancelNotification: async (notificationId: string): Promise<void> => {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  },

  // Cancel all notifications for an item
  cancelItemNotifications: async (itemId: string): Promise<void> => {
    const reminders = await Storage.get<ScheduledReminder[]>(KEYS.REMINDERS) || [];
    const itemReminders = reminders.filter(r => r.itemId === itemId);
    
    for (const reminder of itemReminders) {
      await Notifications.cancelScheduledNotificationAsync(reminder.id);
    }
    
    const updatedReminders = reminders.filter(r => r.itemId !== itemId);
    await Storage.set(KEYS.REMINDERS, updatedReminders);
  },

  // Cancel all scheduled notifications
  cancelAllNotifications: async (): Promise<void> => {
    await Notifications.cancelAllScheduledNotificationsAsync();
    await Storage.remove(KEYS.REMINDERS);
  },

  // Get all scheduled notifications
  getScheduledNotifications: async () => {
    return await Notifications.getAllScheduledNotificationsAsync();
  },

  // Save reminder to storage
  saveReminder: async (reminder: ScheduledReminder): Promise<void> => {
    const reminders = await Storage.get<ScheduledReminder[]>(KEYS.REMINDERS) || [];
    const existingIndex = reminders.findIndex(r => r.id === reminder.id);
    
    if (existingIndex >= 0) {
      reminders[existingIndex] = reminder;
    } else {
      reminders.push(reminder);
    }
    
    await Storage.set(KEYS.REMINDERS, reminders);
  },

  // Parse time string "Morning", "Afternoon", etc. to hours
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
};

// Update KEYS to include reminders
export const NOTIFICATION_KEYS = {
  REMINDERS: 'peptrack_reminders',
  NOTIFICATION_ENABLED: 'peptrack_notifications_enabled',
};
