import { create } from 'zustand';
import { apiRequest } from '@/lib/api';

export interface Transaction {
  _id?: string;
  type: 'income' | 'expense' | 'investment' | 'insurance' | 'transfer';
  category: string;
  subcategory?: string;
  amount: number;
  direction: 'in' | 'out';
  date: string;
  account?: string;
  description?: string;
  notes?: string;
  tags?: string[];
  status?: string;
  isRecurring?: boolean;
  recurrence?: {
    frequency?: string;
    endDate?: string;
    nextDate?: string;
  };
  relatedId?: string;
  relatedType?: string;
  attachments?: any[];
  isFavorite?: boolean;
}

export interface TransactionAnalytics {
  totalIncome: number;
  totalExpense: number;
  totalInvestment: number;
  netCashFlow: number;
  savingsRate: number;
  transactionCount: number;
  categoryBreakdown: { name: string; income: number; expense: number }[];
  typeBreakdown: { name: string; value: number }[];
  monthlyTrend: { month: string; income: number; expense: number; investment: number }[];
  dailyCashFlow: { date: string; inflow: number; outflow: number }[];
  recentTransactions: Transaction[];
  topExpenseCategories: { name: string; income: number; expense: number }[];
}

export interface TransactionSummary {
  monthIncome: number;
  monthExpense: number;
  monthInvestment: number;
  monthSavings: number;
  monthSavingsRate: number;
  todayCount: number;
  monthCount: number;
}

interface TransactionFilters {
  type?: string;
  category?: string;
  status?: string;
  direction?: string;
  account?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: string;
  maxAmount?: string;
  search?: string;
  tags?: string[];
  favorite?: boolean;
  page?: number;
  limit?: number;
  sort?: string;
}

interface TransactionState {
  transactions: Transaction[];
  total: number;
  page: number;
  pages: number;
  analytics: TransactionAnalytics | null;
  summary: TransactionSummary | null;
  budget: any;
  categories: Record<string, string[]>;
  loading: boolean;
  filters: TransactionFilters;
  setFilters: (filters: Partial<TransactionFilters>) => void;
  fetchTransactions: (filters?: TransactionFilters) => Promise<void>;
  fetchAnalytics: (startDate?: string, endDate?: string) => Promise<void>;
  fetchSummary: () => Promise<void>;
  fetchBudget: (month?: number, year?: number) => Promise<void>;
  fetchCategories: () => Promise<void>;
  addTransaction: (txn: Partial<Transaction>) => Promise<Transaction>;
  updateTransaction: (id: string, txn: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  bulkImport: (transactions: Partial<Transaction>[]) => Promise<void>;
  saveBudget: (budget: { month: number; year: number; totalBudget: number; categories: any[] }) => Promise<void>;
}

export const useTransactionStore = create<TransactionState>((set, get) => ({
  transactions: [],
  total: 0,
  page: 1,
  pages: 1,
  analytics: null,
  summary: null,
  budget: null,
  categories: {},
  loading: false,
  filters: { page: 1, limit: 50, sort: '-date' },

  setFilters: (filters) => {
    set((state) => ({ filters: { ...state.filters, ...filters } }));
  },

  fetchTransactions: async (filters) => {
    set({ loading: true });
    try {
      const currentFilters = filters || get().filters;
      const params = new URLSearchParams();
      Object.entries(currentFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value)) value.forEach(v => params.append(key, v));
          else params.set(key, String(value));
        }
      });
      const data = await apiRequest(`/transactions?${params.toString()}`);
      set({
        transactions: data.transactions,
        total: data.total,
        page: data.page,
        pages: data.pages,
        loading: false,
      });
    } catch (err) {
      set({ loading: false });
    }
  },

  fetchAnalytics: async (startDate, endDate) => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      const data = await apiRequest(`/transactions/analytics?${params.toString()}`);
      set({ analytics: data });
    } catch (err) {
      console.error(err);
    }
  },

  fetchSummary: async () => {
    try {
      const data = await apiRequest('/transactions/summary');
      set({ summary: data });
    } catch (err) {
      console.error(err);
    }
  },

  fetchBudget: async (month, year) => {
    try {
      const params = new URLSearchParams();
      if (month) params.set('month', String(month));
      if (year) params.set('year', String(year));
      const data = await apiRequest(`/transactions/budget?${params.toString()}`);
      set({ budget: data });
    } catch (err) {
      console.error(err);
    }
  },

  fetchCategories: async () => {
    try {
      const data = await apiRequest('/transactions/categories');
      set({ categories: data });
    } catch (err) {
      console.error(err);
    }
  },

  addTransaction: async (txn) => {
    set({ loading: true });
    try {
      const data = await apiRequest('/transactions', {
        method: 'POST',
        body: JSON.stringify(txn),
      });
      set((state) => ({
        transactions: [data, ...state.transactions],
        loading: false,
      }));
      return data;
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  updateTransaction: async (id, txn) => {
    set({ loading: true });
    try {
      const data = await apiRequest(`/transactions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(txn),
      });
      set((state) => ({
        transactions: state.transactions.map(t => t._id === id ? data : t),
        loading: false,
      }));
    } catch (err) {
      set({ loading: false });
    }
  },

  deleteTransaction: async (id) => {
    set({ loading: true });
    try {
      await apiRequest(`/transactions/${id}`, { method: 'DELETE' });
      set((state) => ({
        transactions: state.transactions.filter(t => t._id !== id),
        loading: false,
      }));
    } catch (err) {
      set({ loading: false });
    }
  },

  toggleFavorite: async (id) => {
    try {
      const data = await apiRequest(`/transactions/${id}/favorite`, { method: 'POST' });
      set((state) => ({
        transactions: state.transactions.map(t => t._id === id ? data : t),
      }));
    } catch (err) {
      console.error(err);
    }
  },

  bulkImport: async (transactions) => {
    set({ loading: true });
    try {
      await apiRequest('/transactions/bulk', {
        method: 'POST',
        body: JSON.stringify({ transactions }),
      });
      await get().fetchTransactions();
    } catch (err) {
      set({ loading: false });
    }
  },

  saveBudget: async (budget) => {
    try {
      const data = await apiRequest('/transactions/budget', {
        method: 'POST',
        body: JSON.stringify(budget),
      });
      set({ budget: data });
    } catch (err) {
      console.error(err);
    }
  },
}));
