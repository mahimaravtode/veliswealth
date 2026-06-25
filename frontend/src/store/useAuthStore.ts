import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  setAuth: (user: User, token: string, refreshToken?: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      setAuth: (user, token, refreshToken) => set((state) => ({ 
        user, 
        token, 
        refreshToken: refreshToken || state.refreshToken, 
        isAuthenticated: true 
      })),
      logout: () => set({ user: null, token: null, refreshToken: null, isAuthenticated: false }),
    }),
    {
      name: 'auth-storage',
    }
  )
);
