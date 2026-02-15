import { RecurringItem, RecurringDoseLog, DoseStatus } from '../types/recurring';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

async function apiRequest(endpoint: string, options?: RequestInit) {
  if (!BACKEND_URL) {
    throw new Error('Backend URL not configured. Set EXPO_PUBLIC_BACKEND_URL.');
  }
  const res = await fetch(`${BACKEND_URL}${endpoint}`, {
    ...options,
    credentials: 'include',
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

export const api = {
  get: (endpoint: string) => apiRequest(endpoint),
  post: (endpoint: string, body: any) =>
    apiRequest(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  put: (endpoint: string, body: any) =>
    apiRequest(endpoint, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  delete: (endpoint: string) =>
    apiRequest(endpoint, { method: 'DELETE' }),
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
