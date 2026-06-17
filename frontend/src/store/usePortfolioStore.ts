import { create } from 'zustand';
import { apiRequest } from '@/lib/api';

interface Holding {
  schemeCode: string;
  schemeName: string;
  units: number;
  avgNav: number;
  currentNav: number;
  category: string;
}

interface PortfolioSummary {
  totalInvested: number;
  currentValue: number;
  totalGain: number;
  xirr: number;
}

interface PortfolioState {
  holdings: Holding[];
  summary: PortfolioSummary;
  loading: boolean;
  error: string | null;
  fetchPortfolio: () => Promise<void>;
  syncHoldings: (holdings: Holding[]) => Promise<void>;
}

export const usePortfolioStore = create<PortfolioState>((set) => ({
  holdings: [],
  summary: {
    totalInvested: 0,
    currentValue: 0,
    totalGain: 0,
    xirr: 0,
  },
  loading: false,
  error: null,

  fetchPortfolio: async () => {
    set({ loading: true, error: null });
    try {
      const data = await apiRequest('/portfolio');
      set({ 
        holdings: data.holdings || [], 
        summary: data.summary || { totalInvested: 0, currentValue: 0, totalGain: 0, xirr: 0 },
        loading: false 
      });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  syncHoldings: async (holdings) => {
    set({ loading: true, error: null });
    try {
      const data = await apiRequest('/portfolio/sync', {
        method: 'POST',
        body: JSON.stringify({ holdings }),
      });
      set({ 
        holdings: data.holdings, 
        summary: data.summary,
        loading: false 
      });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },
}));
