import { RecurringItem, RecurringDoseLog, DoseStatus } from '../types/recurring';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export const api = {
  get: async (endpoint: string) => {
    const res = await fetch(`${BACKEND_URL}${endpoint}`, {
      credentials: 'include',
    });
    if (!res.ok) throw new Error(`API ${res.status}`);
    return res.json();
  },
  post: async (endpoint: string, body: any) => {
    const res = await fetch(`${BACKEND_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`API ${res.status}`);
    return res.json();
  },
  put: async (endpoint: string, body: any) => {
    const res = await fetch(`${BACKEND_URL}${endpoint}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`API ${res.status}`);
    return res.json();
  },
  delete: async (endpoint: string) => {
    const res = await fetch(`${BACKEND_URL}${endpoint}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!res.ok) throw new Error(`API ${res.status}`);
    return res.json();
  },
};

// Recurring Items API
export const recurringItemsApi = {
  create: (item: Omit<RecurringItem, 'item_id' | 'is_active' | 'created_at'>) =>
    api.post('/api/recurring-items', item),

  getAll: (activeOnly = true): Promise<RecurringItem[]> =>
    api.get(`/api/recurring-items?active_only=${activeOnly}`),

  getById: (itemId: string): Promise<RecurringItem> =>
    api.get(`/api/recurring-items/${itemId}`),

  update: (itemId: string, updates: Partial<RecurringItem>) =>
    api.put(`/api/recurring-items/${itemId}`, updates),

  delete: (itemId: string) =>
    api.delete(`/api/recurring-items/${itemId}`),

  getScheduleForDate: (date: string): Promise<RecurringItem[]> =>
    api.get(`/api/recurring-items/schedule/${date}`),

  logDose: (log: {
    recurring_item_id: string;
    scheduled_date: string;
    scheduled_time: string;
    status: DoseStatus;
    reason?: string;
    actual_time?: string;
  }): Promise<RecurringDoseLog> =>
    api.post('/api/recurring-items/dose-log', log),

  getDoseLogs: (date: string): Promise<RecurringDoseLog[]> =>
    api.get(`/api/recurring-items/dose-logs/${date}`),
};
