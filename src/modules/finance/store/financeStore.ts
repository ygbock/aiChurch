import { create } from 'zustand';

export interface Transaction {
  id: string;
  type: 'donation' | 'expense' | 'payroll' | 'transfer';
  amount: number;
  currency: string;
  status: 'pending' | 'success' | 'failed';
  date: string;
  provider: string;
  reference: string;
  metadata?: Record<string, any>;
}

export interface FinanceState {
  transactions: Transaction[];
  balanceSLL: number;
  isLoading: boolean;
  addTransaction: (tx: Transaction) => void;
  setTransactions: (txs: Transaction[]) => void;
  fetchTransactions: () => Promise<void>;
}

export const useFinanceStore = create<FinanceState>((set) => ({
  transactions: [],
  balanceSLL: 0,
  isLoading: false,
  
  addTransaction: (tx) => set((state) => ({ 
    transactions: [tx, ...state.transactions],
    balanceSLL: tx.status === 'success' && tx.type === 'donation' 
      ? state.balanceSLL + tx.amount 
      : state.balanceSLL
  })),

  setTransactions: (txs) => set({ transactions: txs }),

  fetchTransactions: async () => {
    set({ isLoading: true });
    try {
      // Logic to fetch transactions from API
      // const data = await api.get('/finance/transactions');
      // set({ transactions: data });
    } catch (error) {
      console.error("Failed to fetch transactions", error);
    } finally {
      set({ isLoading: false });
    }
  }
}));
