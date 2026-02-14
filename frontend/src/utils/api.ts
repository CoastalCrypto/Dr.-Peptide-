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
  delete: async (endpoint: string) => {
    const res = await fetch(`${BACKEND_URL}${endpoint}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!res.ok) throw new Error(`API ${res.status}`);
    return res.json();
  },
};
