import { useAuthStore } from '@/store/useAuthStore';
import { API_BASE } from '@/lib/config';

export async function apiRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
  const state = useAuthStore.getState();
  const token = state.token;
  const refreshToken = state.refreshToken;
  const setAuth = state.setAuth;
  const logout = state.logout;

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });
  } catch {
    throw new Error(
      'Cannot reach the server. Start the backend: cd backend && npm run dev'
    );
  }

  // Handle Token Expiration
  if (response.status === 401) {
    if (refreshToken) {
      console.log(`Token expired for ${endpoint}, attempting refresh...`);
      try {
        const refreshResponse = await fetch(`${API_BASE}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });

        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          console.log('Token refreshed successfully');
          
          if (state.user) {
            setAuth(state.user, data.token);
          }

          const newHeaders = {
              ...headers,
              'Authorization': `Bearer ${data.token}`
          };
          response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers: newHeaders });
        } else {
          console.warn('Refresh token invalid or expired, logging out');
          logout();
          if (typeof window !== 'undefined') window.location.href = '/login';
          return; // Stop processing
        }
      } catch (err) {
        console.error('Token refresh failed:', err);
        logout();
        if (typeof window !== 'undefined') window.location.href = '/login';
        return;
      }
    } else {
      console.warn(`Unauthorized [401] for ${endpoint} and no refresh token available, logging out`);
      logout();
      if (typeof window !== 'undefined') window.location.href = '/login';
      return;
    }
  }

  // Check if response is JSON
  const contentType = response.headers.get('content-type');
  let data;
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = { message: await response.text() };
  }

  if (!response.ok) {
    console.error(`API Error [${response.status}] ${endpoint}:`, data);
    throw new Error(data.message || `API Error ${response.status}`);
  }

  return data;
}
