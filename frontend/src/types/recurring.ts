// Types for Recurring Items feature

export type RecurrenceType = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'custom';
export type DoseStatus = 'pending' | 'taken' | 'skipped' | 'delayed';
export type ItemCategory = 'peptide' | 'supplement' | 'medication' | 'other';

export interface RecurringItem {
  item_id: string;
  name: string;
  type: string;
  dosage_amount: number;
  dosage_unit: string;
  route: string;
  recurrence_type: RecurrenceType;
  recurrence_days: number[]; // 0=Sun, 1=Mon, etc.
  recurrence_interval: number;
  times_of_day: string[];
  start_date: string;
  end_date?: string;
  notes?: string;
  category?: ItemCategory;
  reminder_enabled: boolean;
  is_active: boolean;
  created_at: string;
}

export interface RecurringDoseLog {
  log_id: string;
  recurring_item_id: string;
  scheduled_date: string;
  scheduled_time: string;
  status: DoseStatus;
  reason?: string;
  actual_time?: string;
  logged_at: string;
}

export interface ScheduledDose {
  item: RecurringItem;
  time: string;
  status: DoseStatus;
  log?: RecurringDoseLog;
}

export const DAYS_OF_WEEK = [
  { id: 0, short: 'Sun', full: 'Sunday' },
  { id: 1, short: 'Mon', full: 'Monday' },
  { id: 2, short: 'Tue', full: 'Tuesday' },
  { id: 3, short: 'Wed', full: 'Wednesday' },
  { id: 4, short: 'Thu', full: 'Thursday' },
  { id: 5, short: 'Fri', full: 'Friday' },
  { id: 6, short: 'Sat', full: 'Saturday' },
];

export const RECURRENCE_OPTIONS = [
  { id: 'daily', label: 'Daily', description: 'Every day' },
  { id: 'weekly', label: 'Weekly', description: 'Same days each week' },
  { id: 'biweekly', label: 'Bi-weekly', description: 'Every 2 weeks' },
  { id: 'monthly', label: 'Monthly', description: 'Same date each month' },
  { id: 'custom', label: 'Custom', description: 'Set your own interval' },
];

export const CATEGORY_COLORS: Record<ItemCategory, string> = {
  peptide: '#39FF14',
  supplement: '#00A8E8',
  medication: '#FF6B6B',
  other: '#9B59B6',
};

export const TIME_SLOTS = ['Morning', 'Afternoon', 'Evening', 'Bedtime'];
