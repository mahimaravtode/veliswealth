import { create } from 'zustand';
import { apiRequest } from '@/lib/api';

export interface Prepayment {
  amount: number;
  date: string;
  type: 'partial' | 'full';
  note?: string;
}

export interface Loan {
  _id?: string;
  title: string;
  loanAmount: number;
  interestRate: number;
  tenure: number;
  tenureType: 'years' | 'months';
  startDate: string;
  loanType: string;
  bankName: string;
  emiPaid: number;
  prepayments: Prepayment[];
  emiHistory?: Array<{
    month: number;
    year: number;
    emi: number;
    principal: number;
    interest: number;
    balance: number;
    date: Date;
  }>;
}

interface LoanState {
  loans: Loan[];
  loading: boolean;
  error: string | null;
  fetchLoans: () => Promise<void>;
  addLoan: (loan: Partial<Loan>) => Promise<void>;
  deleteLoan: (id: string) => Promise<void>;
  updateLoan: (id: string, loan: Partial<Loan>) => Promise<void>;
  addPrepayment: (loanId: string, prepayment: Prepayment) => Promise<void>;
}

export const useLoanStore = create<LoanState>((set) => ({
  loans: [],
  loading: false,
  error: null,

  fetchLoans: async () => {
    set({ loading: true, error: null });
    try {
      const data = await apiRequest('/loans');
      set({ loans: data, loading: false });
    } catch (err: any) {
      set({ loading: false, error: err.message || 'Failed to fetch loans' });
      throw err;
    }
  },

  addLoan: async (loan) => {
    set({ loading: true, error: null });
    try {
      const data = await apiRequest('/loans', {
        method: 'POST',
        body: JSON.stringify(loan),
      });
      set((state) => ({ loans: [...state.loans, data], loading: false }));
    } catch (err: any) {
      set({ loading: false, error: err.message || 'Failed to add loan' });
      throw err;
    }
  },

  deleteLoan: async (id) => {
    set({ loading: true, error: null });
    try {
      await apiRequest(`/loans/${id}`, { method: 'DELETE' });
      set((state) => ({ loans: state.loans.filter((l) => l._id !== id), loading: false }));
    } catch (err: any) {
      set({ loading: false, error: err.message || 'Failed to delete loan' });
      throw err;
    }
  },

  updateLoan: async (id, loan) => {
    set({ loading: true, error: null });
    try {
      const data = await apiRequest(`/loans/${id}`, {
        method: 'PUT',
        body: JSON.stringify(loan),
      });
      set((state) => ({
        loans: state.loans.map((l) => (l._id === id ? data : l)),
        loading: false,
      }));
    } catch (err: any) {
      set({ loading: false, error: err.message || 'Failed to update loan' });
      throw err;
    }
  },

  addPrepayment: async (loanId, prepayment) => {
    set({ loading: true, error: null });
    try {
      const data = await apiRequest(`/loans/${loanId}/prepayment`, {
        method: 'POST',
        body: JSON.stringify(prepayment),
      });
      set((state) => ({
        loans: state.loans.map((l) => (l._id === loanId ? data : l)),
        loading: false,
      }));
    } catch (err: any) {
      set({ loading: false, error: err.message || 'Failed to add prepayment' });
      throw err;
    }
  },
}));
