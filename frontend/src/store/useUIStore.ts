import { create } from 'zustand';

interface UIState {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

function getInitialTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  const saved = localStorage.getItem('theme') as 'light' | 'dark' | null;
  if (saved) return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme: 'light' | 'dark') {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

const initialTheme = getInitialTheme();
if (typeof window !== 'undefined') {
  applyTheme(initialTheme);
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: false,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  activeTab: 'dashboard',
  setActiveTab: (tab) => set({ activeTab: tab }),
  theme: initialTheme,
  toggleTheme: () => set((state) => {
    const newTheme = state.theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
    return { theme: newTheme };
  }),
}));
