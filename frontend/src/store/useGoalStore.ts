import { create } from 'zustand';
import { apiRequest } from '@/lib/api';

export interface Contribution {
  amount: number;
  date: string;
  note?: string;
}

export interface Goal {
  _id?: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  monthlyContribution?: number;
  targetDate?: string;
  category: string;
  priority?: string;
  status?: string;
  icon?: string;
  color?: string;
  contributions?: Contribution[];
  milestones?: any[];
  notes?: string;
}

interface GoalState {
  goals: Goal[];
  loading: boolean;
  fetchGoals: () => Promise<void>;
  addGoal: (goal: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  updateGoal: (id: string, goal: Partial<Goal>) => Promise<void>;
}

export const useGoalStore = create<GoalState>((set) => ({
  goals: [],
  loading: false,

  fetchGoals: async () => {
    set({ loading: true });
    try {
      const data = await apiRequest('/goals');
      set({ goals: data, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  addGoal: async (goal) => {
    set({ loading: true });
    try {
      const data = await apiRequest('/goals', {
        method: 'POST',
        body: JSON.stringify(goal),
      });
      set((state) => ({ goals: [...state.goals, data], loading: false }));
    } catch {
      set({ loading: false });
    }
  },

  deleteGoal: async (id) => {
    set({ loading: true });
    try {
      await apiRequest(`/goals/${id}`, { method: 'DELETE' });
      set((state) => ({ goals: state.goals.filter((g) => g._id !== id), loading: false }));
    } catch {
      set({ loading: false });
    }
  },

  updateGoal: async (id, goal) => {
    set({ loading: true });
    try {
      const data = await apiRequest(`/goals/${id}`, {
        method: 'PUT',
        body: JSON.stringify(goal),
      });
      set((state) => ({
        goals: state.goals.map((g) => (g._id === id ? data : g)),
        loading: false,
      }));
    } catch {
      set({ loading: false });
    }
  },
}));
