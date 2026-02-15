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

// Vendor types
export interface Vendor {
  vendor_id: string;
  name: string;
  website?: string;
  email?: string;
  phone?: string;
  payment_methods: string[];
  notes?: string;
  rating?: number;
  is_domestic: boolean;
  ships_to: string[];
  avg_shipping_days?: number;
  is_active: boolean;
  created_at: string;
}

export interface Order {
  order_id: string;
  vendor_id: string;
  vendor_name: string;
  order_number?: string;
  order_date: string;
  items: string[];
  total_amount?: number;
  currency: string;
  status: 'pending' | 'shipped' | 'delivered' | 'cancelled';
  tracking_number?: string;
  tracking_url?: string;
  expected_delivery?: string;
  actual_delivery?: string;
  notes?: string;
  created_at: string;
}

// Vendors API
export const vendorsApi = {
  create: (vendor: Omit<Vendor, 'vendor_id' | 'is_active' | 'created_at'>) =>
    api.post('/api/vendors', vendor),

  getAll: (activeOnly = true): Promise<Vendor[]> =>
    api.get(`/api/vendors?active_only=${activeOnly}`),

  getById: (vendorId: string): Promise<Vendor> =>
    api.get(`/api/vendors/${vendorId}`),

  update: (vendorId: string, updates: Partial<Vendor>) =>
    api.put(`/api/vendors/${vendorId}`, updates),

  delete: (vendorId: string) =>
    api.delete(`/api/vendors/${vendorId}`),

  getOrders: (vendorId: string): Promise<Order[]> =>
    api.get(`/api/vendors/${vendorId}/orders`),
};

// Orders API
export const ordersApi = {
  create: (order: Omit<Order, 'order_id' | 'vendor_name' | 'created_at'>) =>
    api.post('/api/orders', order),

  getAll: (vendorId?: string, status?: string): Promise<Order[]> => {
    let url = '/api/orders';
    const params: string[] = [];
    if (vendorId) params.push(`vendor_id=${vendorId}`);
    if (status) params.push(`status=${status}`);
    if (params.length) url += '?' + params.join('&');
    return api.get(url);
  },

  getById: (orderId: string): Promise<Order> =>
    api.get(`/api/orders/${orderId}`),

  update: (orderId: string, updates: Partial<Order>) =>
    api.put(`/api/orders/${orderId}`, updates),

  delete: (orderId: string) =>
    api.delete(`/api/orders/${orderId}`),
};
