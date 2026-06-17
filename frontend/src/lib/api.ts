import { useAuthStore } from '@/store/useAuthStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export async function apiRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
  const { token, refreshToken, setAuth, logout } = useAuthStore.getState();

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  let response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401 && refreshToken) {
    try {
      const refreshResponse = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (refreshResponse.ok) {
        const { token: newToken } = await refreshResponse.json();
        setAuth(useAuthStore.getState().user!, newToken);
        response = await fetch(`${API_URL}${endpoint}`, {
          ...options,
          headers: { ...headers, 'Authorization': `Bearer ${newToken}` },
        });
      } else {
        logout();
      }
    } catch {
      logout();
    }
  }

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Something went wrong');
  return data;
}
